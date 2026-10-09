using AgenteBarbearia.Api.Models;
using AgenteBarbearia.Api.Repositories;

namespace AgenteBarbearia.Api.Services
{
    /// <summary>
    /// Serviço de fundo que roda diariamente às 9h e envia lembretes de agendamentos
    /// para os clientes com compromissos marcados no dia seguinte.
    /// Após enviar, registra no histórico para que o agente tenha contexto
    /// ao receber a resposta SIM/NÃO do cliente.
    /// </summary>
    public class LembretesService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<LembretesService> _logger;

        // Horário em que os lembretes são disparados (hora local)
        private static readonly TimeOnly HorarioEnvio = new(9, 0);

        public LembretesService(IServiceProvider services, ILogger<LembretesService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("LembretesService iniciado. Lembretes serão enviados às {Hora}.", HorarioEnvio);

            while (!stoppingToken.IsCancellationRequested)
            {
                var agora = DateTime.Now;
                var proximoDisparo = ProximoDisparo(agora);
                var espera = proximoDisparo - agora;

                _logger.LogInformation("Próximo envio de lembretes em {Quando} (aguardando {Espera:hh\\:mm\\:ss}).",
                    proximoDisparo, espera);

                await Task.Delay(espera, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    break;

                await EnviarLembretesAsync(stoppingToken);
            }
        }

        private async Task EnviarLembretesAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _services.CreateScope();
                var agendamentoRepo  = scope.ServiceProvider.GetRequiredService<AgendamentoRepository>();
                var profissionalRepo = scope.ServiceProvider.GetRequiredService<ProfissionalRepository>();
                var servicoRepo      = scope.ServiceProvider.GetRequiredService<ServicoRepository>();
                var whatsApp         = scope.ServiceProvider.GetRequiredService<WhatsAppService>();
                var atendimentoRepo  = scope.ServiceProvider.GetRequiredService<AtendimentoRepository>();

                // Busca todos os agendamentos do dia SEGUINTE (00:00 até 23:59)
                var amanha     = DateTime.Today.AddDays(1);
                var inicioDia  = DateTime.SpecifyKind(amanha, DateTimeKind.Utc);
                var fimDia     = DateTime.SpecifyKind(amanha.AddDays(1), DateTimeKind.Utc);

                var agendamentos = await agendamentoRepo.ListarAgendadosNaDataAsync(
                    inicioDia, fimDia, cancellationToken);

                if (agendamentos.Count == 0)
                {
                    _logger.LogInformation("Nenhum agendamento para amanhã ({Data:dd/MM/yyyy}). Nenhum lembrete enviado.",
                        amanha);
                    return;
                }

                _logger.LogInformation("Enviando {Total} lembrete(s) para amanhã ({Data:dd/MM/yyyy}).",
                    agendamentos.Count, amanha);

                foreach (var agendamento in agendamentos)
                {
                    try
                    {
                        var profissional = await profissionalRepo.ObterPorIdAsync(
                            agendamento.ProfissionalId, cancellationToken);
                        var servico = await servicoRepo.ObterPorIdAsync(
                            agendamento.ServicoId, cancellationToken);

                        var nomeProfissional = profissional?.Nome ?? "a profissional";
                        var nomeServico      = servico?.Nome ?? "seu serviço";
                        var horario          = agendamento.Inicio.ToLocalTime().ToString("HH:mm");
                        var data             = agendamento.Inicio.ToLocalTime().ToString("dd/MM/yyyy");

                        var mensagem =
                            $"Olá! 😊 Aqui é a Lia, recepcionista do *Studio Vision*.\n\n" +
                            $"Este é um lembrete do seu compromisso de amanhã:\n\n" +
                            $"📅 *Data:* {data}\n" +
                            $"⏰ *Horário:* {horario}\n" +
                            $"✂️ *Serviço:* {nomeServico}\n" +
                            $"👩 *Profissional:* {nomeProfissional}\n\n" +
                            $"Por favor, confirme sua presença respondendo *SIM* ✅ ou avise caso precise cancelar respondendo *NÃO* ❌.\n\n" +
                            $"Te esperamos! 🌟";

                        await whatsApp.EnviarMensagemAsync(agendamento.NomeCliente, mensagem, cancellationToken);

                        // ── Salva no histórico para dar contexto ao agente ──────────────
                        // Quando o cliente responder SIM ou NÃO, o agente verá esta entrada
                        // e saberá exatamente qual agendamento está sendo confirmado/cancelado.
                        var contextoLembrete =
                            $"[LEMBRETE_ENVIADO] " +
                            $"agendamentoId={agendamento.Id} | " +
                            $"servico={nomeServico} | " +
                            $"profissional={nomeProfissional} | " +
                            $"data={data} | horario={horario}";

                        await atendimentoRepo.SalvarHistoricoAtendimento(new HistoricoAtendimento
                        {
                            NomeUsuario     = agendamento.NomeCliente,
                            NomeReal        = agendamento.NomeCliente,
                            MensagemUsuario = contextoLembrete,
                            RespostaAgente  = null,
                            DataHora        = DateTime.Now
                        });

                        _logger.LogInformation("Lembrete enviado para {Cliente} — {Servico} às {Horario}.",
                            agendamento.NomeCliente, nomeServico, horario);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Erro ao enviar lembrete para {Cliente}.", agendamento.NomeCliente);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro geral ao processar lembretes.");
            }
        }

        /// <summary>
        /// Calcula o próximo momento em que o lembrete deve ser disparado.
        /// Se o horário de envio já passou hoje, agenda para amanhã.
        /// </summary>
        private static DateTime ProximoDisparo(DateTime agora)
        {
            var disparo = agora.Date.Add(HorarioEnvio.ToTimeSpan());
            return agora < disparo ? disparo : disparo.AddDays(1);
        }
    }
}
