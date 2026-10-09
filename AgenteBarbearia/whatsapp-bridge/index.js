const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const QRCode = require('qrcode')
const axios = require('axios')
const express = require('express')
const path = require('path')

const API_URL = 'http://localhost:5152/api/whatsapp'
const SESSION_DIR = path.join(__dirname, 'auth_session')
const BRIDGE_PORT = 3001

// Mapa de número → JID original (para lidar com @lid vs @s.whatsapp.net)
const jidMap = new Map()

// Último QR Code gerado (como string raw do Baileys)
let latestQR = null

// ─── Servidor HTTP para receber chamadas de envio da API .NET ────────────────
const app = express()
app.use(express.json())

// POST /send  { number: "5511999999999", text: "mensagem" }
app.post('/send', async (req, res) => {
    const { number, text } = req.body
    if (!number || !text) {
        return res.status(400).json({ erro: 'Campos number e text são obrigatórios' })
    }
    if (!global.sock || !global.sock.user) {
        return res.status(503).json({ erro: 'WhatsApp não conectado ou não autenticado' })
    }
    try {
        // Busca o JID original salvo ou constrói um novo
        let jid
        if (number.includes('@')) {
            jid = number
        } else if (jidMap.has(number)) {
            jid = jidMap.get(number)
            console.log(`🔍 JID encontrado no cache: ${jid}`)
        } else {
            jid = `${number}@s.whatsapp.net`
        }
        console.log(`📤 [${new Date().toLocaleTimeString()}] Enviando para ${jid}...`)
        const result = await global.sock.sendMessage(jid, { text })
        console.log(`✅ [${new Date().toLocaleTimeString()}] Enviado para ${number}: ${text.substring(0, 80)}...`)
        res.json({ ok: true, msgId: result?.key?.id })
    } catch (err) {
        console.error('❌ Erro ao enviar mensagem:', err.message)
        // Se o erro é de conexão, limpa o socket
        if (err.message?.includes('Connection Closed') || err.output?.statusCode === 428) {
            global.sock = null
        }
        res.status(500).json({ erro: err.message })
    }
})

app.get('/status', (req, res) => {
    res.json({
        conectado: !!global.sock,
        numero: global.sock?.user?.id ?? null
    })
})

// GET /qr → retorna o QR Code atual como imagem PNG base64
app.get('/qr', async (req, res) => {
    if (!latestQR) {
        if (global.sock?.user) {
            return res.status(200).json({ status: 'conectado', qr: null })
        }
        return res.status(404).json({ erro: 'Nenhum QR disponível ainda. Aguarde alguns segundos.' })
    }
    try {
        const dataUrl = await QRCode.toDataURL(latestQR, { width: 300, margin: 2 })
        res.json({ status: 'aguardando_scan', qr: dataUrl })
    } catch (err) {
        res.status(500).json({ erro: err.message })
    }
})

// Serve o qrcode.html diretamente pelo bridge
app.get('/qrcode', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'qrcode.html'))
})

app.listen(BRIDGE_PORT, () => {
    console.log(`🌐 Bridge HTTP escutando em http://localhost:${BRIDGE_PORT}`)
    console.log(`   POST /send  { number, text }`)
    console.log(`   GET  /status`)
})

// ─── Conexão WhatsApp via Baileys ────────────────────────────────────────────
let reconectando = false

async function conectar() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion()

    console.log(`\n🟢 Studio Vision WhatsApp Bridge`)
    console.log(`📡 Baileys v${version.join('.')}`)
    console.log(`🔗 API: ${API_URL}\n`)

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Studio Vision', 'Chrome', '120.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        // Evita conflito com outras sessões Web abertas
        shouldIgnoreJid: jid => jid?.endsWith('@g.us'),
    })

    // ── QR Code e status de conexão ──────────────────────────────────────────
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            latestQR = qr
            console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n')
            qrcode.generate(qr, { small: true })
            console.log('\n⚠️  Expira em 60 segundos!')
            console.log(`🌐 Ou escaneie pelo browser: http://localhost:${BRIDGE_PORT}/qrcode\n`)
        }

        if (connection === 'open') {
            reconectando = false
            latestQR = null  // limpa o QR após conexão
            // Só expõe o socket após conexão aberta e autenticada
            global.sock = sock
            console.log('✅ WhatsApp conectado com sucesso!')
            console.log(`📞 Número: ${sock.user?.id}`)
        }

        if (connection === 'close') {
            global.sock = null
            const code = lastDisconnect?.error?.output?.statusCode
            const motivo = lastDisconnect?.error?.message ?? 'desconhecido'
            const deslogado = code === DisconnectReason.loggedOut

            console.log(`❌ Desconectado — código: ${code} | motivo: ${motivo}`)

            if (deslogado) {
                console.log('⛔ Sessão encerrada (logout). Delete a pasta auth_session e reinicie.')
                process.exit(0)
            }

            if (!reconectando) {
                reconectando = true
                const delay = code === 440 ? 5000 : 3000  // conflict → aguarda mais
                console.log(`🔄 Reconectando em ${delay / 1000}s...`)
                setTimeout(() => {
                    reconectando = false
                    conectar()
                }, delay)
            }
        }
    })

    // ── Salvar credenciais ───────────────────────────────────────────────────
    sock.ev.on('creds.update', saveCreds)

    // ── Receber mensagens e encaminhar para a API .NET ───────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return

        for (const msg of messages) {
            if (msg.key.fromMe) continue
            if (!msg.message) continue

            const remoteJid = msg.key.remoteJid
            if (remoteJid?.endsWith('@g.us')) continue  // ignora grupos

            // Extrai número e salva o JID original (pode ser @lid ou @s.whatsapp.net)
            const numero = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '')
            jidMap.set(numero, remoteJid)

            // ── Verifica se é áudio ──────────────────────────────────────────
            const isAudio = !!(msg.message.audioMessage || msg.message.pttMessage)

            if (isAudio) {
                console.log(`\n🎤 [${new Date().toLocaleTimeString()}] Áudio de ${numero} — transcrevendo...`)
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
                    const audioBase64 = buffer.toString('base64')
                    const mimeType = msg.message.audioMessage?.mimetype || msg.message.pttMessage?.mimetype || 'audio/ogg; codecs=opus'

                    const resp = await axios.post(API_URL, {
                        event: 'MESSAGES_UPSERT',
                        data: {
                            key: { remoteJid, fromMe: false, id: msg.key.id },
                            message: {
                                audioMessage: {
                                    base64: audioBase64,
                                    mimetype: mimeType
                                }
                            },
                            pushName: msg.pushName || numero
                        }
                    }, { timeout: 60000 })

                    console.log(`✅ Áudio encaminhado para API: ${resp.status}`)
                } catch (err) {
                    console.error(`❌ Erro ao processar áudio: ${err.message}`)
                }
                continue
            }

            // ── Verifica se é imagem ─────────────────────────────────────────
            const isImagem = !!msg.message.imageMessage

            if (isImagem) {
                console.log(`\n🖼️  [${new Date().toLocaleTimeString()}] Imagem de ${numero} — enviando para API...`)
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
                    const imagemBase64 = buffer.toString('base64')
                    const mimeType  = msg.message.imageMessage?.mimetype || 'image/jpeg'
                    const caption   = msg.message.imageMessage?.caption  || ''

                    const resp = await axios.post(API_URL, {
                        event: 'MESSAGES_UPSERT',
                        data: {
                            key: { remoteJid, fromMe: false, id: msg.key.id },
                            message: {
                                imageMessage: {
                                    base64: imagemBase64,
                                    mimetype: mimeType,
                                    caption: caption
                                }
                            },
                            pushName: msg.pushName || numero
                        }
                    }, { timeout: 60000 })

                    console.log(`✅ Imagem encaminhada para API: ${resp.status}`)
                } catch (err) {
                    console.error(`❌ Erro ao processar imagem: ${err.message}`)
                }
                continue
            }


            // ── Mensagem de texto ────────────────────────────────────────────
            const texto =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                null

            if (!texto) continue

            console.log(`\n📩 [${new Date().toLocaleTimeString()}] De ${numero} (${remoteJid}): ${texto}`)

            try {
                const resp = await axios.post(API_URL, {
                    event: 'MESSAGES_UPSERT',
                    data: {
                        key: { remoteJid, fromMe: false, id: msg.key.id },
                        message: { conversation: texto },
                        pushName: msg.pushName || numero
                    }
                }, { timeout: 30000 })

                console.log(`✅ API respondeu: ${resp.status}`)
            } catch (err) {
                console.error(`❌ Erro ao chamar API: ${err.message}`)
            }
        }
    })
}

conectar().catch(console.error)
