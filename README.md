# NextCalendar

Um projeto de calendário moderno desenvolvido com arquitetura de monorepo, separando frontend e backend para melhor manutenção e escalabilidade.

## 📋 Requisitos

### Geral
- Git
- Make (opcional, mas recomendado)

### Backend
- Java 11 ou superior
- Maven 3.6.0 ou superior (ou use o Maven Wrapper incluído)

### Frontend
- Node.js 14.0.0 ou superior
- npm ou yarn

## 🚀 Como Executar

### Executando o Backend

#### Usando Make (Recomendado)
```bash
# Exibir todos os comandos disponíveis
make help

# Executar a aplicação Spring Boot
make run

# Ou especificamente
make backend-run
```

#### Sem Make
```bash
cd backend

# Em Linux/Mac
./mvnw spring-boot:run

# Em Windows
mvnw.cmd spring-boot:run
```

### Executando Testes do Backend

#### Usando Make
```bash
make backend-test
```

#### Sem Make
```bash
cd backend
./mvnw test
```

### Build do Backend

#### Usando Make
```bash
make backend-build
```

#### Sem Make
```bash
cd backend
./mvnw package -DskipTests
```

### Limpando Build Artifacts

#### Usando Make
```bash
make backend-clean
```

#### Sem Make
```bash
cd backend
./mvnw clean
```

### Executando o Frontend

```bash
cd frontend

# Instalar dependências
npm install
# ou
yarn install

# Executar em desenvolvimento
npm start
# ou
yarn start

# Build para produção
npm run build
# ou
yarn build
```

## 📁 Estrutura do Projeto

```
nextcalendarv1/
├── Makefile              # Comandos de build e execução
├── README.md            # Este arquivo
├── backend/             # API Spring Boot
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── mvnw.cmd
└── frontend/            # Aplicação Frontend (React/Vue/Angular)
    └── (será inicializado)
```

## 🛠️ Principais Comandos

| Comando | Descrição |
|---------|-----------|
| `make help` | Exibe todos os comandos disponíveis |
| `make run` | Inicia o backend |
| `make backend-test` | Executa testes do backend |
| `make backend-build` | Compila o backend |
| `make backend-clean` | Remove artefatos de build |

## 📝 Notas

- A aplicação backend roda por padrão em `http://localhost:8080`
- Para alterar a porta, configure em `backend/src/main/resources/application.properties`
- O projeto está estruturado como monorepo para facilitar desenvolvimento paralelo de frontend e backend

## 🤝 Contribuindo

Ao fazer alterações, utilize commits semânticos seguindo a convenção Conventional Commits:
- `feat:` para novas features
- `fix:` para correções de bugs
- `refactor:` para refatoração de código
- `docs:` para alterações em documentação
- `test:` para testes
- `chore:` para outras tarefas


# 🤖 Tutorial — Como Rodar o Agente de Barbearia

> Agente de atendimento via WhatsApp para o **Studio Vision**, com IA (OpenAI), agenda real, lembretes automáticos, suporte a voz e fotos.

---

## 📋 O que você vai precisar

| Requisito | Versão mínima | Link |
|---|---|---|
| .NET SDK | 10.0 | https://dotnet.microsoft.com/download |
| Node.js | 18+ | https://nodejs.org |
| Docker Desktop | qualquer | https://www.docker.com/products/docker-desktop |
| Chave de API OpenAI | — | https://platform.openai.com/api-keys |
| WhatsApp no celular | — | Para escanear o QR Code |

---

## 🗂️ Estrutura do Projeto

```
AgenteBarbearia/
├── AgenteBarbearia.Api/        ← API .NET (agente, agenda, webhooks)
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   └── appsettings.json        ← ⚠️ Configurar aqui
├── whatsapp-bridge/            ← Bridge Node.js (Baileys)
│   └── index.js
└── docker-compose.yml          ← MongoDB + Mongo Express + Evolution API
```

---

## 🚀 Passo a Passo

### Passo 1 — Clonar / Baixar o projeto

Se ainda não tem o projeto, clone o repositório:

```powershell
git clone <url-do-repositorio>
cd AgenteBarbearia
```

---

### Passo 2 — Configurar a chave da OpenAI

Abra o arquivo `AgenteBarbearia.Api/appsettings.json` e preencha sua chave:

```json
"OpenAI": {
  "Model": "gpt-4o-mini",
  "Key": "sk-proj-SUA_CHAVE_AQUI"
}
```

> ⚠️ **Nunca commite sua chave no Git!** Use variável de ambiente em produção:
> ```powershell
> $env:OpenAI__Key = "sk-proj-SUA_CHAVE_AQUI"
> ```

---

### Passo 3 — Subir o banco de dados e serviços (Docker)

Na **raiz do projeto** (onde está o `docker-compose.yml`), execute:

```powershell
docker compose up -d
```

Isso vai subir 4 serviços:

| Serviço | URL | Credenciais |
|---|---|---|
| **MongoDB** | `mongodb://localhost:27018` | — |
| **Mongo Express** (painel visual) | http://localhost:5051 | usuário: `edn` / senha: `edn` |
| **PostgreSQL** (para Evolution API) | interno | — |
| **Evolution API** (WhatsApp REST) | http://localhost:8080 | API Key: `studiovision2026` |

Aguarde ~30 segundos para tudo subir. Verifique com:

```powershell
docker compose ps
```

Todos devem estar com status `running`.

---

### Passo 4 — Instalar dependências do Bridge WhatsApp

```powershell
cd whatsapp-bridge
npm install
```

---

### Passo 5 — Rodar a API .NET

Abra um **novo terminal** e execute:

```powershell
cd AgenteBarbearia.Api
dotnet run
```

A API vai subir em **http://localhost:5152**.

Na primeira execução, o sistema cria automaticamente o catálogo com:
- ✂️ **Gabriel** — 13 serviços de barbearia masculina
- ✨ **Bárbara** — 33 serviços de beleza e estética

Você verá no log:
```
info: Catálogo criado: 38 serviços e 2 profissionais (Gabriel e Bárbara).
```

> 💡 O **Swagger** fica disponível em http://localhost:5152/swagger para testar os endpoints diretamente.

---

### Passo 6 — Rodar o Bridge WhatsApp (Node.js)

Abra **outro terminal** e execute:

```powershell
cd whatsapp-bridge
node index.js
```

Um QR Code vai aparecer no terminal. **Escaneie com seu WhatsApp:**

```
WhatsApp → ... → Dispositivos conectados → Conectar dispositivo
```

Ou abra no navegador: **http://localhost:3001/qrcode**

Quando conectar, você verá:
```
✅ WhatsApp conectado com sucesso!
📞 Número: 5541999999999@s.whatsapp.net
```

---

### Passo 7 — Configurar o Webhook na Evolution API

Para que as mensagens do WhatsApp cheguem ao agente, configure o webhook:

**Opção A — Via Swagger da Evolution API (http://localhost:8080):**

1. Acesse http://localhost:8080/docs
2. Autentique com a API Key: `studiovision2026`
3. Crie uma instância e configure o webhook apontando para: `http://localhost:5152/api/whatsapp`

**Opção B — Via curl:**

```powershell
# Criar instância
curl -X POST http://localhost:8080/instance/create `
  -H "apikey: studiovision2026" `
  -H "Content-Type: application/json" `
  -d '{"instanceName": "studio-vision", "webhook": {"url": "http://localhost:5152/api/whatsapp", "events": ["MESSAGES_UPSERT"]}}'
```

---

## ✅ Verificando se tudo está funcionando

### Teste rápido via Swagger

Acesse http://localhost:5152/swagger e chame `POST /api/Atendimento`:

```json
{
  "nomeUsuario": "Teste",
  "mensagem": "Olá, quais serviços vocês têm?"
}
```

A resposta deve vir com a Lia apresentando as categorias de serviços.

### Teste via WhatsApp

Mande qualquer mensagem para o número conectado. O agente vai responder automaticamente.

---

## 🕘 Lembretes Automáticos

O sistema envia lembretes **todos os dias às 9h** para clientes com agendamentos no dia seguinte. Não é necessário configurar nada — funciona automaticamente.

Quando o cliente responder **SIM** ou **NÃO**, o agente cuida do restante:
- **SIM** → confirma a presença
- **NÃO** → pergunta se quer remarcar ou cancelar, e executa a ação

---

## 📁 Resumo das Portas

| Serviço | Porta |
|---|---|
| API .NET (Agente) | `5152` |
| Bridge WhatsApp (Node.js) | `3001` |
| Evolution API | `8080` |
| MongoDB | `27018` |
| Mongo Express (painel) | `5051` |

---

## ⚙️ Configurações da Barbearia

No arquivo `AgenteBarbearia.Api/appsettings.json`, seção `Barbearia`:

```json
"Barbearia": {
  "Nome": "Studio Vision",
  "DiasFuncionamento": [2, 3, 4, 5, 6],
  "Abre": "09:00",
  "Fecha": "19:00",
  "IntervaloAlmocoInicio": "12:00",
  "IntervaloAlmocoFim": "13:00",
  "SlotMinutos": 30
}
```

| Campo | Significado |
|---|---|
| `DiasFuncionamento` | 0=Dom, 1=Seg, 2=Ter ... 6=Sáb |
| `Abre` / `Fecha` | Horário de funcionamento |
| `IntervaloAlmocoInicio/Fim` | Pausa do almoço (sem agendamentos) |
| `SlotMinutos` | Intervalo entre horários disponíveis |

---

## 🔄 Reiniciando do Zero (limpar dados)

Se quiser apagar todos os dados do banco e recriar o catálogo:

```powershell
# Para os containers
docker compose down -v

# Sobe novamente (recria volumes)
docker compose up -d

# Reinicia a API (vai rodar o seed novamente)
dotnet run
```

---

## ❗ Problemas Comuns

| Problema | Solução |
|---|---|
| `MongoDB não conecta` | Verificar se o Docker está rodando: `docker compose ps` |
| `QR Code não aparece` | Acessar http://localhost:3001/qrcode no navegador |
| `Agente não responde no WhatsApp` | Verificar se o webhook está configurado apontando para `:5152/api/whatsapp` |
| `Erro de chave OpenAI` | Conferir a chave em `appsettings.json` |
| `Catálogo vazio` | O seed só roda uma vez. Se o banco já tem dados, limpe com `docker compose down -v` |
| `Áudio não transcreve` | Verificar se o modelo Whisper está acessível (mesma chave OpenAI) |

---

## 🧩 Recursos do Agente

| Funcionalidade | Status |
|---|---|
| Atendimento em linguagem natural | ✅ |
| Coleta e memoriza o nome do cliente | ✅ |
| Consulta horários disponíveis em tempo real | ✅ |
| Agenda, remarca e cancela | ✅ |
| Transcrição de mensagens de voz (Whisper) | ✅ |
| Análise de fotos enviadas pelo cliente (Vision) | ✅ |
| Lembretes automáticos na véspera (9h) | ✅ |
| Fluxo SIM/NÃO ao lembrete | ✅ |
| Encaminha para humano quando necessário | ✅ |


## 📧 Suporte

Para dúvidas ou problemas, verifique o README específico de cada diretório:
- [Backend README](./backend/README.md)
