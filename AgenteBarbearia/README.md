# AgenteBarbearia

API ASP.NET Core de um agente de atendimento para barbearia. O agente conversa com o cliente, consulta o catálogo e a agenda reais e consegue marcar, remarcar ou cancelar horários usando ferramentas (function calling) da OpenAI.

## O que o agente faz

- Atende o cliente em linguagem natural
- Consulta serviços, profissionais, funcionamento e horários disponíveis
- Agenda, remarca e cancela pelo nome do cliente
- Mantém histórico de atendimento no MongoDB
- Encaminha para um humano em reclamações ou casos sensíveis
- Não inventa horários, preços ou confirmações: só usa o que as ferramentas devolvem

Há também endpoints REST de catálogo e agenda, independentes do chat.

## Stack

- .NET 10 / ASP.NET Core
- OpenAI SDK (`gpt-4o-mini` por padrão)
- MongoDB
- Swagger / OpenAPI
- Docker Compose (MongoDB + Mongo Express)

## Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para o MongoDB)
- Uma **chave de API da OpenAI**

## Configuração da chave de API (obrigatório)

A chave da OpenAI **não vem no repositório**. Sem ela o agente de atendimento não funciona.

1. Crie uma chave em [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Abra `AgenteBarbearia.Api/appsettings.json`
3. Preencha o campo `OpenAI:Key`:

```json
"OpenAI": {
  "Model": "gpt-4o-mini",
  "Key": "cole-aqui-sua-chave"
}
```

Não commite a chave. Se for versionar o projeto, use User Secrets, variável de ambiente ou um `appsettings.Development.json` local (fora do Git).

Alternativa por variável de ambiente (PowerShell):

```powershell
$env:OpenAI__Key = "cole-aqui-sua-chave"
```

## Como executar

### 1. Subir o MongoDB

Na raiz do repositório:

```powershell
docker compose up -d
```

Isso sobe:

| Serviço        | URL                         | Observação                                      |
|----------------|-----------------------------|-------------------------------------------------|
| MongoDB        | `mongodb://localhost:27018` | Banco `agente_barbearia`                          |
| Mongo Express  | http://localhost:5051       | Usuário `edn` / senha `edn`                     |

### 2. Rodar a API

```powershell
cd AgenteBarbearia.Api
dotnet run
```

A API sobe em **http://localhost:5152**. O Swagger abre automaticamente em http://localhost:5152/swagger.

Na primeira execução, se o catálogo estiver vazio, o seed cria 4 serviços e 3 profissionais.

## Configuração da barbearia

Em `appsettings.json`, seção `Barbearia`:

| Campo                  | Valor padrão                         |
|------------------------|--------------------------------------|
| Nome                   | Barbearia Exemplo                    |
| Dias de funcionamento  | Terça a sábado (`2` a `6`)           |
| Abre / fecha           | 09:00 – 19:00                        |
| Intervalo de almoço    | 12:00 – 13:00                        |
| Slot                   | 30 minutos                           |

## Catálogo inicial (seed)

**Serviços**

| Serviço        | Duração | Preço |
|----------------|---------|-------|
| Corte masculino | 30 min | R$ 45 |
| Barba           | 20 min | R$ 35 |
| Corte + Barba   | 50 min | R$ 70 |
| Sobrancelha     | 15 min | R$ 20 |

**Profissionais**

- **Carlos** — todos os serviços
- **Rafael** — corte e combo
- **Lucas** — barba e sobrancelha

## Endpoints

### Chat do agente

`POST /api/Atendimento`

```json
{
  "nomeUsuario": "Joao",
  "mensagem": "Tem horário amanhã à tarde para corte?"
}
```

Campo opcional: `dataReferencia` (útil para testes com uma data/hora fixa).

Resposta (exemplo):

```json
{
  "usuario": "Joao",
  "intencao": "consultar horários",
  "resposta": "Amanhã à tarde o Carlos tem 15h e 16h para corte. Qual prefere?",
  "sentimento": "neutro",
  "proximaAcao": "aguardar escolha do horário",
  "acaoExecutada": "consultar_horarios",
  "agendamentoId": "",
  "encaminhamento": {
    "necessario": false,
    "agenteDestino": "",
    "motivo": ""
  }
}
```

O histórico fica gravado no MongoDB por `nomeUsuario`. Use o mesmo nome nas próximas mensagens para manter o contexto.

### Catálogo e agenda

| Método | Rota                                      | Descrição                          |
|--------|-------------------------------------------|------------------------------------|
| GET    | `/api/servicos`                           | Lista serviços                     |
| GET    | `/api/profissionais`                      | Lista profissionais                |
| GET    | `/api/horarios?data=YYYY-MM-DD&servicoId=` | Horários livres (serviço ou nome) |
| GET    | `/api/agendamentos?nomeUsuario=`          | Agenda do cliente                  |
| POST   | `/api/agendamentos`                       | Criar agendamento                  |
| PUT    | `/api/agendamentos/{id}`                  | Remarcar                           |
| POST   | `/api/agendamentos/{id}/cancelar`         | Cancelar                           |

Em horários e agendamentos, `servicoId` e `profissionalId` aceitam o ObjectId **ou** o nome (`Corte masculino`, `Carlos`, etc.).

Há exemplos prontos em `AgenteBarbearia.Api/AgenteBarbearia.Api.http` (ajuste o host para `http://localhost:5152` se o arquivo ainda apontar outra porta).

## Ferramentas do agente

O modelo só altera a agenda por estas funções:

- `listar_servicos`
- `listar_profissionais`
- `funcionamento`
- `consultar_horarios`
- `listar_agendamentos_cliente`
- `agendar`
- `cancelar_agendamento`
- `remarcar_agendamento`

## Estrutura

```
AgenteBarbearia/
├── AgenteBarbearia.Api/
│   ├── Controllers/     Atendimento, serviços, profissionais, horários, agendamentos
│   ├── Services/        Agente (OpenAI + tools) e regras de agenda
│   ├── Repositories/    MongoDB
│   ├── Models/          Agendamento, histórico, profissional, serviço
│   └── appsettings.json Configuração (Mongo, barbearia, OpenAI)
├── docker-compose.yml   MongoDB + Mongo Express
└── AgenteBarbearia.slnx
```
