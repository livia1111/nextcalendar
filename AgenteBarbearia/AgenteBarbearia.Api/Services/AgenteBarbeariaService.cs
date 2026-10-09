using System.Globalization;
using System.Text;
using System.Text.Json;
using AgenteBarbearia.Api.Dtos;
using AgenteBarbearia.Api.Models;
using OpenAI.Chat;

namespace AgenteBarbearia.Api.Services
{
    /// <summary>
    /// Agente de atendimento da barbearia, com ferramentas de agenda.
    /// </summary>
    public class AgenteBarbeariaService
    {
        private const int MaximoIteracoesFerramentas = 8;

        private static readonly JsonSerializerOptions JsonOpcoes = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly ChatClient _chatClient;
        private readonly AgendaService _agenda;

        public AgenteBarbeariaService(ChatClient chatClient, AgendaService agenda)
        {
            _chatClient = chatClient;
            _agenda = agenda;
        }

        public async Task<AtendimentoSuporteResponse> GerarRespostaAsync(
            AtendimentoSuporteRequest request,
            List<HistoricoAtendimento> historicos,
            CancellationToken cancellationToken = default)
        {
            var agora = request.dataReferencia ?? DateTime.Now;
            var mensagens = new List<ChatMessage>
            {
                new SystemChatMessage(CriarPromptSistema()),
                CriarMensagemUsuario(request, historicos, agora)
            };

            var opcoesFerramentas = new ChatCompletionOptions();
            foreach (var ferramenta in CriarFerramentas())
                opcoesFerramentas.Tools.Add(ferramenta);

            for (var i = 0; i < MaximoIteracoesFerramentas; i++)
            {
                ChatCompletion completion = await _chatClient.CompleteChatAsync(
                    mensagens,
                    opcoesFerramentas,
                    cancellationToken);

                if (completion.FinishReason == ChatFinishReason.ToolCalls)
                {
                    mensagens.Add(new AssistantChatMessage(completion));
                    foreach (var toolCall in completion.ToolCalls)
                    {
                        var resultado = await ExecutarFerramentaAsync(toolCall, request.nomeUsuario, cancellationToken);
                        mensagens.Add(new ToolChatMessage(toolCall.Id, resultado));
                    }

                    continue;
                }

                mensagens.Add(new AssistantChatMessage(completion));
                break;
            }

            mensagens.Add(new UserChatMessage(
                "Com base na conversa e nos resultados das ferramentas, retorne somente o JSON final do atendimento. Não invente horários, ids ou confirmações que as ferramentas não devolveram."));

            ChatCompletion jsonCompletion = await _chatClient.CompleteChatAsync(
                mensagens,
                CriarOpcoesJson(),
                cancellationToken);

            var json = jsonCompletion.Content.Count > 0 ? jsonCompletion.Content[0].Text : null;
            var response = string.IsNullOrWhiteSpace(json)
                ? null
                : JsonSerializer.Deserialize<AtendimentoSuporteResponse>(json, JsonOpcoes);

            return response ?? new AtendimentoSuporteResponse(
                request.nomeUsuario,
                "erro",
                "Não consegui montar a resposta agora. Pode repetir o pedido?",
                "neutro",
                "pedir para o cliente repetir",
                "informar",
                "",
                new EncaminhamentoAtendimento(false, "", ""));
        }

        private static List<ChatTool> CriarFerramentas()
        {
            return
            [
                ChatTool.CreateFunctionTool(
                    functionName: "listar_servicos",
                    functionDescription: "Lista os serviços da barbearia com duração e preço."),
                ChatTool.CreateFunctionTool(
                    functionName: "listar_profissionais",
                    functionDescription: "Lista os barbeiros e os serviços que cada um realiza."),
                ChatTool.CreateFunctionTool(
                    functionName: "funcionamento",
                    functionDescription: "Informa nome da casa, dias e horários de funcionamento, incluindo intervalo de almoço."),
                ChatTool.CreateFunctionTool(
                    functionName: "consultar_horarios",
                    functionDescription: "Consulta horários reais disponíveis para uma data e um serviço. Use sempre esta ferramenta antes de oferecer vagas.",
                    functionParameters: BinaryData.FromBytes("""
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "string",
                          "description": "Data no formato YYYY-MM-DD"
                        },
                        "servico": {
                          "type": "string",
                          "description": "Nome ou id do serviço"
                        },
                        "profissional": {
                          "type": "string",
                          "description": "Nome ou id do barbeiro. Vazio para todos que fazem o serviço."
                        }
                      },
                      "required": ["data", "servico"]
                    }
                    """u8.ToArray())),
                ChatTool.CreateFunctionTool(
                    functionName: "listar_agendamentos_cliente",
                    functionDescription: "Lista os agendamentos do cliente que está falando."),
                ChatTool.CreateFunctionTool(
                    functionName: "agendar",
                    functionDescription: "Confirma um agendamento real. Só use quando serviço, profissional e horário já estiverem claros.",
                    functionParameters: BinaryData.FromBytes("""
                    {
                      "type": "object",
                      "properties": {
                        "servico": {
                          "type": "string",
                          "description": "Nome ou id do serviço"
                        },
                        "profissional": {
                          "type": "string",
                          "description": "Nome ou id do barbeiro"
                        },
                        "inicio": {
                          "type": "string",
                          "description": "Início no formato YYYY-MM-DDTHH:mm:ss"
                        }
                      },
                      "required": ["servico", "profissional", "inicio"]
                    }
                    """u8.ToArray())),
                ChatTool.CreateFunctionTool(
                    functionName: "cancelar_agendamento",
                    functionDescription: "Cancela um agendamento do próprio cliente pelo id.",
                    functionParameters: BinaryData.FromBytes("""
                    {
                      "type": "object",
                      "properties": {
                        "agendamentoId": {
                          "type": "string",
                          "description": "Id do agendamento"
                        }
                      },
                      "required": ["agendamentoId"]
                    }
                    """u8.ToArray())),
                ChatTool.CreateFunctionTool(
                    functionName: "remarcar_agendamento",
                    functionDescription: "Remarca um agendamento do próprio cliente para um novo início.",
                    functionParameters: BinaryData.FromBytes("""
                    {
                      "type": "object",
                      "properties": {
                        "agendamentoId": {
                          "type": "string",
                          "description": "Id do agendamento"
                        },
                        "inicio": {
                          "type": "string",
                          "description": "Novo início no formato YYYY-MM-DDTHH:mm:ss"
                        }
                      },
                      "required": ["agendamentoId", "inicio"]
                    }
                    """u8.ToArray()))
            ];
        }

        private async Task<string> ExecutarFerramentaAsync(
            ChatToolCall toolCall,
            string nomeUsuario,
            CancellationToken cancellationToken)
        {
            try
            {
                using var args = JsonDocument.Parse(
                    string.IsNullOrWhiteSpace(toolCall.FunctionArguments.ToString())
                        ? "{}"
                        : toolCall.FunctionArguments.ToString());
                var root = args.RootElement;

                switch (toolCall.FunctionName)
                {
                    case "listar_servicos":
                        return Json(new
                        {
                            sucesso = true,
                            dados = await _agenda.ListarServicosAsync(cancellationToken)
                        });

                    case "listar_profissionais":
                        return Json(new
                        {
                            sucesso = true,
                            dados = await _agenda.ListarProfissionaisAsync(cancellationToken)
                        });

                    case "funcionamento":
                        return Json(new
                        {
                            sucesso = true,
                            dados = _agenda.ObterFuncionamento()
                        });

                    case "consultar_horarios":
                        {
                            var dataTexto = LerString(root, "data");
                            var servico = LerString(root, "servico");
                            var profissional = LerString(root, "profissional");

                            if (dataTexto is null || servico is null)
                                return JsonFalha("Informe data (YYYY-MM-DD) e serviço.");

                            if (!DateOnly.TryParse(dataTexto, CultureInfo.InvariantCulture, DateTimeStyles.None, out var data))
                                return JsonFalha("Data inválida. Use YYYY-MM-DD.");

                            var resultado = await _agenda.ConsultarHorariosAsync(
                                data,
                                servico,
                                profissional,
                                cancellationToken);

                            return JsonResultado(resultado);
                        }

                    case "listar_agendamentos_cliente":
                        return JsonResultado(await _agenda.ListarAgendamentosClienteAsync(nomeUsuario, cancellationToken));

                    case "agendar":
                        {
                            var servico = LerString(root, "servico");
                            var profissional = LerString(root, "profissional");
                            var inicioTexto = LerString(root, "inicio");

                            if (servico is null || profissional is null || inicioTexto is null)
                                return JsonFalha("Informe serviço, profissional e início.");

                            if (!TryParseDataHora(inicioTexto, out var inicio))
                                return JsonFalha("Início inválido. Use YYYY-MM-DDTHH:mm:ss.");

                            var resultado = await _agenda.CriarAgendamentoAsync(
                                nomeUsuario,
                                servico,
                                profissional,
                                inicio,
                                cancellationToken);

                            return JsonResultado(resultado);
                        }

                    case "cancelar_agendamento":
                        {
                            var id = LerString(root, "agendamentoId");
                            if (id is null)
                                return JsonFalha("Informe agendamentoId.");

                            return JsonResultado(await _agenda.CancelarAgendamentoAsync(id, nomeUsuario, cancellationToken));
                        }

                    case "remarcar_agendamento":
                        {
                            var id = LerString(root, "agendamentoId");
                            var inicioTexto = LerString(root, "inicio");
                            if (id is null || inicioTexto is null)
                                return JsonFalha("Informe agendamentoId e início.");

                            if (!TryParseDataHora(inicioTexto, out var inicio))
                                return JsonFalha("Início inválido. Use YYYY-MM-DDTHH:mm:ss.");

                            return JsonResultado(await _agenda.RemarcarAgendamentoAsync(id, nomeUsuario, inicio, cancellationToken));
                        }

                    default:
                        return JsonFalha($"Ferramenta não reconhecida: {toolCall.FunctionName}");
                }
            }
            catch (Exception ex)
            {
                return JsonFalha($"Erro ao executar {toolCall.FunctionName}: {ex.Message}");
            }
        }

        private static ChatCompletionOptions CriarOpcoesJson()
        {
            return new ChatCompletionOptions
            {
                ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
                    jsonSchemaFormatName: "resposta_atendimento",
                    jsonSchema: BinaryData.FromBytes("""
                    {
                      "type": "object",
                      "additionalProperties": false,
                      "properties": {
                        "usuario": { "type": "string" },
                        "intencao": { "type": "string" },
                        "resposta": { "type": "string" },
                        "sentimento": {
                          "type": "string",
                          "enum": ["positivo", "neutro", "negativo"]
                        },
                        "proximaAcao": { "type": "string" },
                        "acaoExecutada": {
                          "type": "string",
                          "enum": ["informar", "consultar_horarios", "agendar", "cancelar", "remarcar", "encaminhar"]
                        },
                        "agendamentoId": { "type": "string" },
                        "encaminhamento": {
                          "type": "object",
                          "additionalProperties": false,
                          "properties": {
                            "necessario": { "type": "boolean" },
                            "agenteDestino": { "type": "string" },
                            "motivo": { "type": "string" }
                          },
                          "required": ["necessario", "agenteDestino", "motivo"]
                        }
                      },
                      "required": [
                        "usuario",
                        "intencao",
                        "resposta",
                        "sentimento",
                        "proximaAcao",
                        "acaoExecutada",
                        "agendamentoId",
                        "encaminhamento"
                      ]
                    }
                    """u8.ToArray()),
                    jsonSchemaIsStrict: true)
            };
        }

        private static string CriarPromptSistema()
        {
            return """
                Você é a Lia, recepcionista virtual do *Studio Vision* — salão completo de beleza e barbearia.

                ## APRESENTAÇÃO (primeira mensagem)
                Quando o histórico estiver vazio OU o nome do cliente for um número de telefone, apresente-se e peaça o nome:
                "Olá! 😊 Seja bem-vindo(a) ao *Studio Vision*! Sou a Lia, recepcionista virtual do estúdio.
                Antes de começarmos, pode me dizer seu nome? Assim consigo te chamar direitinho! 😊"

                Quando o cliente informar o nome, confirme com carinho e salve-o como o identificador do atendimento.
                A partir daí, use sempre o nome do cliente para personalizar as respostas.

                Se já houver histórico com nome conhecido, cumprimente-o pelo nome de forma natural:
                "Olá, [Nome]! 😊 Que ótimo te ver de novo. Como posso te ajudar hoje?"

                ## PROFISSIONAIS
                O Studio Vision tem dois profissionais. Informe-os quando o cliente perguntar ou quando for relevante:

                ✂️ *Gabriel* — especialista em barbearia masculina:
                Barba, Corte masculino, Corte raspado máquina, Corte e barba, Combo raspado + barba,
                Corte com Visagismo, Corte e Barba com Visagismo, Blindagem, Blindagem / selagem,
                Progressiva masculina, Sobrancelha, Dep. orelha e nariz, Pezinho.

                ✨ *Bárbara* — especialista em beleza e estética:
                ✂️ Cortes: Corte feminino, Corte masculino, Corte de franja, Corte raspado máquina
                💈 Barba: Barba, Combo corte e barba, Combo raspado + barba
                💅 Unhas e Esmaltação: Mão simples, Pé simples, Mão francesinha, Esmaltação em Gel mão, Esmaltação em Gel pé, Remoção de esmaltação em gel, Combo mão e pé
                🎨 Coloração e Tratamentos: Coloração pessoal, Hidratação com Escova Curto e Medio, Hidratação com Escova Longo, Remoção Alongamento
                💇 Escova e Penteados: Escova curta, Escova media, Escova longa, Escova Curto com baby liss, Escova Medio/Longo com baby liss, Chapinha, Lavado S/ escova
                👁️ Estética Facial: Sobrancelha designer, Sobrancelha excesso, Buço, Maquiagem express, Maquiagem festa/com cílios
                ✨ Combos: Combo Corte Com Hidratação e Escova, Adicional cabelo com mega hair, Adicional de serviço

                Apresente os serviços da Bárbara por categoria (um grupo de cada vez), nunca todos de uma vez.
                Para o Gabriel, liste diretamente pois o menu é mais enxuto.

                ## SUA FUNÇÃO
                - Atender o cliente com simpatia, clareza e objetividade.
                - Usar o histórico para entender o contexto da conversa e personalizar o atendimento.
                - Identificar intenção e sentimento do cliente.
                - Consultar e alterar a agenda somente pelas ferramentas.
                - Retornar somente JSON válido no passo final, conforme o schema.

                ## LEMBRETES AUTOMÁTICOS (já implementado)
                O sistema envia automaticamente uma mensagem de lembrete 1 dia antes do agendamento.
                Não é necessário mencionar esse lembrete ao agendar.

                O histórico pode conter uma entrada com o marcador [LEMBRETE_ENVIADO] contendo o agendamentoId,
                serviço, profissional, data e horário. Use essas informações para contextualizar a resposta do cliente.

                ## FLUXO DE RESPOSTA AO LEMBRETE

                Se o cliente responder *SIM* (ou variações como "sim", "confirmado", "vou sim", "estarei lá"):
                - Confirme com entusiasmo pelo nome do cliente.
                - Reforce o horário, serviço e profissional.
                - Exemplo: "Ótimo, [Nome]! ✅ Te esperamos amanhã às [horario] com [profissional] para [servico]. Qualquer dúvida, é só chamar! 😊"

                Se o cliente responder *NÃO* (ou variações como "não posso", "vou cancelar", "não vou conseguir"):
                - PRIMEIRO pergunte se deseja remarcar ou cancelar definitivamente:
                  "Tudo bem, [Nome]! 😊 Você gostaria de *remarcar* para outro dia ou prefere *cancelar* o agendamento?"
                - Se o cliente quiser REMARCAR:
                  1. Pergunte a nova data de preferência.
                  2. Consulte os horários disponíveis usando a ferramenta consultar_horarios.
                  3. Apresente as opções e confirme o novo horário.
                  4. Use remarcar_agendamento com o agendamentoId do lembrete e o novo início.
                - Se o cliente quiser CANCELAR:
                  1. Confirme a intenção: "Confirmo o cancelamento do seu [servico] com [profissional] em [data] às [horario]?"
                  2. Após confirmação, use cancelar_agendamento com o agendamentoId do lembrete.
                  3. Encerre com simpatia: "Cancelamento feito! 😊 Quando quiser agendar novamente, é só chamar."

                ## REGRAS
                - Não invente serviços, preços, profissionais, horários nem confirmação de agendamento.
                - Para catálogo, funcionamento, vagas, agenda do cliente, marcar, cancelar ou remarcar, use as ferramentas.
                - Se faltar dado (serviço, dia, profissional ou horário), pergunte de forma objetiva.
                - Só chame "agendar" quando serviço, profissional e horário estiverem definidos.
                - Só cancele ou remarque com o id do agendamento do próprio cliente.
                - Se a ferramenta disser que não há vaga ou que falhou, informe isso; não sugira outro horário sem consultar de novo.
                - Encaminhe para "humano" só em reclamação, caso sensível, pedido fora da agenda ou quando o cliente pedir uma pessoa.
                - Se não precisar encaminhar, encaminhamento.necessario = false e agenteDestino = "".
                - agendamentoId deve ser o id devolvido pela ferramenta, ou string vazia.
                - acaoExecutada deve refletir o que de fato aconteceu nesta interação.
                - O campo "resposta" é o texto que o cliente vai ler: escreva como recepcionista. Nunca copie a mensagem do cliente.
                - O campo "usuario" deve conter o nome real do cliente (se já informado), não o número de telefone.
                - Se encaminhar para humano, avise que vai transferir o atendimento e peça um momento.

                Valores permitidos para agenteDestino:
                - "humano"
                - ""
                """;
        }

        /// <summary>
        /// Cria a mensagem do usuário para o chat.
        /// Se houver imagem, monta uma mensagem multimodal (texto + imagem) para o Vision.
        /// </summary>
        private static UserChatMessage CriarMensagemUsuario(
            AtendimentoSuporteRequest request,
            List<HistoricoAtendimento> historicos,
            DateTime agora)
        {
            var textoPrompt = CriarPromptUsuario(request, historicos, agora);

            // Sem imagem → mensagem de texto simples
            if (string.IsNullOrWhiteSpace(request.imagemBase64))
                return new UserChatMessage(textoPrompt);

            // Com imagem → mensagem multimodal (Vision)
            var mimeType = request.imagemMimeType ?? "image/jpeg";
            var bytes    = Convert.FromBase64String(request.imagemBase64);

            return new UserChatMessage(
                ChatMessageContentPart.CreateTextMessageContentPart(textoPrompt),
                ChatMessageContentPart.CreateImageMessageContentPart(
                    BinaryData.FromBytes(bytes),
                    mimeType));
        }

        private static string CriarPromptUsuario(
            AtendimentoSuporteRequest request,
            List<HistoricoAtendimento> historicos,
            DateTime agora)
        {
            var historicoTexto = CriarTextoHistorico(historicos);
            var notaImagem     = string.IsNullOrWhiteSpace(request.imagemBase64)
                ? string.Empty
                : "\n(O cliente também enviou uma foto — analise a imagem acima para entender o contexto.)";

            return $"""
                Data e hora atuais (use para interpretar hoje, amanhã, tarde, etc.):
                {agora:yyyy-MM-ddTHH:mm:ss}

                Nome do cliente:
                {request.nomeUsuario}

                Histórico recente:
                {historicoTexto}

                Mensagem atual:
                {request.mensagem}{notaImagem}

                Atenda o cliente usando as ferramentas necessárias.
                """;
        }

        private static string CriarTextoHistorico(List<HistoricoAtendimento> historico)
        {
            if (historico.Count == 0)
                return "Nenhum histórico anterior.";

            var texto = new StringBuilder();

            foreach (var interacao in historico.OrderBy(item => item.DataHora))
            {
                texto.AppendLine($"Data e Hora: {interacao.DataHora:O}");
                texto.AppendLine($"Mensagem do usuário: {interacao.MensagemUsuario}");
                if (interacao.RespostaAgente is not null)
                {
                    texto.AppendLine($"Resposta anterior: {interacao.RespostaAgente.resposta}");
                    texto.AppendLine($"Intenção anterior: {interacao.RespostaAgente.intencao}");
                    texto.AppendLine($"Próxima ação anterior: {interacao.RespostaAgente.proximaAcao}");
                    texto.AppendLine($"Ação anterior: {interacao.RespostaAgente.acaoExecutada}");
                    if (!string.IsNullOrWhiteSpace(interacao.RespostaAgente.agendamentoId))
                        texto.AppendLine($"Agendamento anterior: {interacao.RespostaAgente.agendamentoId}");
                }
                texto.AppendLine("---");
            }

            return texto.ToString();
        }

        private static string? LerString(JsonElement root, string nome)
        {
            if (!root.TryGetProperty(nome, out var valor))
                return null;

            var texto = valor.ValueKind == JsonValueKind.String ? valor.GetString() : valor.ToString();
            return string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
        }

        private static bool TryParseDataHora(string valor, out DateTime dataHora)
        {
            return DateTime.TryParseExact(
                       valor,
                       ["yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm"],
                       CultureInfo.InvariantCulture,
                       DateTimeStyles.None,
                       out dataHora)
                   || DateTime.TryParse(valor, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out dataHora);
        }

        private static string Json(object valor)
            => JsonSerializer.Serialize(valor, JsonOpcoes);

        private static string JsonResultado<T>(ResultadoAgenda<T> resultado)
            => Json(new
            {
                sucesso = resultado.Sucesso,
                mensagem = resultado.Mensagem,
                dados = resultado.Dados
            });

        private static string JsonFalha(string mensagem)
            => Json(new { sucesso = false, mensagem });
    }
}
