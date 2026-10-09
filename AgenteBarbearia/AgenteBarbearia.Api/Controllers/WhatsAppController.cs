using System.Text.Json;
using AgenteBarbearia.Api.Dtos;
using AgenteBarbearia.Api.Models;
using AgenteBarbearia.Api.Repositories;
using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    /// <summary>
    /// Webhook de integração com o WhatsApp via Evolution API.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppController : ControllerBase
    {
        private readonly AgenteBarbeariaService _agente;
        private readonly WhatsAppService _whatsApp;
        private readonly AtendimentoRepository _repository;
        private readonly TranscricaoService _transcricao;
        private readonly ILogger<WhatsAppController> _logger;

        public WhatsAppController(
            AgenteBarbeariaService agente,
            WhatsAppService whatsApp,
            AtendimentoRepository repository,
            TranscricaoService transcricao,
            ILogger<WhatsAppController> logger)
        {
            _agente = agente;
            _whatsApp = whatsApp;
            _repository = repository;
            _transcricao = transcricao;
            _logger = logger;
        }

        /// <summary>
        /// Verificação de saúde do webhook (chamado pela Evolution API ao configurar).
        /// </summary>
        [HttpGet]
        public IActionResult Get() => Ok(new { status = "webhook ativo", studio = "Studio Vision" });

        /// <summary>
        /// Aceita GET em qualquer sub-rota (ex: /api/whatsapp/connection-update).
        /// </summary>
        [HttpGet("{evento}")]
        public IActionResult GetEvento(string evento) => Ok(new { status = "ok", evento });

        /// <summary>
        /// Recebe eventos da Evolution API (mensagens do WhatsApp).
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> PostAsync(
            [FromBody] JsonElement payload,
            CancellationToken cancellationToken)
            => await ProcessarEvento(payload, cancellationToken);

        /// <summary>
        /// Aceita POST em qualquer sub-rota (ex: /api/whatsapp/messages-upsert, /api/whatsapp/connection-update).
        /// A Evolution API adiciona o nome do evento como sufixo na URL.
        /// </summary>
        [HttpPost("{evento}")]
        public async Task<IActionResult> PostEventoAsync(
            string evento,
            [FromBody] JsonElement payload,
            CancellationToken cancellationToken)
        {
            _logger.LogDebug("Evento recebido: {Evento}", evento);
            return await ProcessarEvento(payload, cancellationToken);
        }

        private async Task<IActionResult> ProcessarEvento(JsonElement payload, CancellationToken cancellationToken)
        {
            try
            {
                // Ignora mensagens enviadas pelo próprio bot (fromMe)
                if (EhMensagemPropria(payload))
                    return Ok();

                var numero = ExtrairNumero(payload);
                if (string.IsNullOrWhiteSpace(numero))
                    return Ok();

                // Tenta extrair texto direto
                var texto = ExtrairTexto(payload);

                // Verifica se é imagem
                string? imagemBase64 = null;
                string? imagemMimeType = null;

                if (string.IsNullOrWhiteSpace(texto))
                {
                    var (imgBase64, imgMime, imgCaption) = ExtrairImagem(payload);
                    if (!string.IsNullOrWhiteSpace(imgBase64))
                    {
                        imagemBase64   = imgBase64;
                        imagemMimeType = imgMime ?? "image/jpeg";
                        // Usa a legenda como texto; se não houver, usa descrição genérica
                        texto = string.IsNullOrWhiteSpace(imgCaption)
                            ? "[O cliente enviou uma foto]"
                            : imgCaption;
                        _logger.LogInformation("WhatsApp [{Numero}]: imagem recebida (caption: {Caption})", numero, texto);
                    }
                }

                // Se não há texto, verifica se é áudio para transcrever
                if (string.IsNullOrWhiteSpace(texto))
                {
                    var (audioBase64, mimeType) = ExtrairAudio(payload);
                    if (!string.IsNullOrWhiteSpace(audioBase64))
                    {
                        _logger.LogInformation("WhatsApp [{Numero}]: áudio recebido — transcrevendo...", numero);
                        texto = await _transcricao.TranscreverAsync(audioBase64, mimeType ?? "audio/ogg", cancellationToken);

                        if (string.IsNullOrWhiteSpace(texto))
                        {
                            await _whatsApp.EnviarMensagemAsync(numero,
                                "Não consegui entender o áudio. Pode me enviar em texto? 😊",
                                cancellationToken);
                            return Ok();
                        }

                        _logger.LogInformation("WhatsApp [{Numero}] (áudio→texto): {Texto}", numero, texto);
                    }
                }

                // Nenhum conteúdo processável
                if (string.IsNullOrWhiteSpace(texto))
                    return Ok();

                _logger.LogInformation("WhatsApp [{Numero}]: {Texto}", numero, texto);

                // Recupera o nome real do cliente (salvo em atendimento anterior)
                var nomeReal = await _repository.ObterNomeRealAsync(numero);

                // Identificador para o agente: nome real se já conhecido, senão o número
                var identificadorAgente = string.IsNullOrWhiteSpace(nomeReal) ? numero : nomeReal;

                var request = new AtendimentoSuporteRequest(
                    nomeUsuario: identificadorAgente,
                    mensagem: texto,
                    dataReferencia: null,
                    imagemBase64: imagemBase64,
                    imagemMimeType: imagemMimeType);

                var historicos = await _repository.ObterHistoricosAtendimento(numero);
                var resposta = await _agente.GerarRespostaAsync(request, historicos, cancellationToken);

                // Extrai nome real da resposta do agente (campo "usuario"), caso o agente o tenha coletado
                var nomeColetado = resposta.usuario;
                var nomeFinal = (!string.IsNullOrWhiteSpace(nomeColetado) && nomeColetado != numero)
                    ? nomeColetado
                    : nomeReal ?? string.Empty;

                // Salva histórico com o nome real atualizado
                await _repository.SalvarHistoricoAtendimento(new HistoricoAtendimento
                {
                    NomeUsuario = numero,
                    NomeReal = nomeFinal,
                    MensagemUsuario = texto,
                    RespostaAgente = resposta,
                    DataHora = DateTime.Now
                });

                // Envia resposta de volta ao cliente no WhatsApp
                await _whatsApp.EnviarMensagemAsync(numero, resposta.resposta, cancellationToken);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar webhook do WhatsApp.");
                return Ok(); // Retorna 200 para não retentar em loop
            }
        }

        // ── Helpers de extração do payload da Evolution API ──────────────────

        private static string? ExtrairNumero(JsonElement payload)
        {
            try
            {
                // Formato Evolution API v2: payload.data.key.remoteJid = "5511999999999@s.whatsapp.net"
                var jid = payload
                    .GetProperty("data")
                    .GetProperty("key")
                    .GetProperty("remoteJid")
                    .GetString();

                return jid?.Split('@')[0]; // Remove o sufixo @s.whatsapp.net
            }
            catch { return null; }
        }

        private static string? ExtrairTexto(JsonElement payload)
        {
            try
            {
                var msg = payload.GetProperty("data").GetProperty("message");

                // Mensagem de texto simples
                if (msg.TryGetProperty("conversation", out var conv))
                    return conv.GetString();

                // Mensagem estendida (ex: resposta a outra mensagem)
                if (msg.TryGetProperty("extendedTextMessage", out var ext))
                    return ext.GetProperty("text").GetString();

                return null;
            }
            catch { return null; }
        }

        /// <summary>
        /// Extrai base64 e mimeType de um audioMessage enviado pelo bridge.
        /// </summary>
        /// <summary>
        /// Extrai base64, mimeType e caption de um imageMessage.
        /// </summary>
        private static (string? Base64, string? MimeType, string? Caption) ExtrairImagem(JsonElement payload)
        {
            try
            {
                var msg = payload.GetProperty("data").GetProperty("message");

                if (msg.TryGetProperty("imageMessage", out var img))
                {
                    var base64  = img.TryGetProperty("base64",   out var b) ? b.GetString() : null;
                    var mime    = img.TryGetProperty("mimetype",  out var m) ? m.GetString() : "image/jpeg";
                    var caption = img.TryGetProperty("caption",   out var c) ? c.GetString() : null;
                    return (base64, mime, caption);
                }

                return (null, null, null);
            }
            catch { return (null, null, null); }
        }

        private static (string? Base64, string? MimeType) ExtrairAudio(JsonElement payload)
        {
            try
            {
                var msg = payload.GetProperty("data").GetProperty("message");

                if (msg.TryGetProperty("audioMessage", out var audio))
                {
                    var base64 = audio.TryGetProperty("base64", out var b) ? b.GetString() : null;
                    var mime   = audio.TryGetProperty("mimetype", out var m) ? m.GetString() : "audio/ogg";
                    return (base64, mime);
                }

                return (null, null);
            }
            catch { return (null, null); }
        }

        private static bool EhMensagemPropria(JsonElement payload)
        {
            try
            {
                return payload
                    .GetProperty("data")
                    .GetProperty("key")
                    .GetProperty("fromMe")
                    .GetBoolean();
            }
            catch { return false; }
        }
    }
}
