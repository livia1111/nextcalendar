using AgenteBarbearia.Api.Models;
using AgenteBarbearia.Api.Repositories;

namespace AgenteBarbearia.Api.Services
{
    public class BarbeariaSeed : IHostedService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<BarbeariaSeed> _logger;

        public BarbeariaSeed(IServiceProvider services, ILogger<BarbeariaSeed> logger)
        {
            _services = services;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _services.CreateScope();
                var servicosRepo = scope.ServiceProvider.GetRequiredService<ServicoRepository>();
                var profissionaisRepo = scope.ServiceProvider.GetRequiredService<ProfissionalRepository>();

                if (await servicosRepo.ContarAsync(cancellationToken) > 0)
                    return;

                // ─── Serviços compartilhados (Gabriel e Bárbara) ───────────────────────
                var barba               = new Servico { Nome = "Barba",                 DuracaoMinutos = 30,  Preco = 55m,  Ativo = true };
                var comboRaspadoBarba   = new Servico { Nome = "Combo raspado + barba", DuracaoMinutos = 30,  Preco = 90m,  Ativo = true };
                var corteEBarba         = new Servico { Nome = "Corte e barba",         DuracaoMinutos = 60,  Preco = 120m, Ativo = true };
                var corteMasculino      = new Servico { Nome = "Corte masculino",       DuracaoMinutos = 30,  Preco = 70m,  Ativo = true };
                var corteRaspadoMaquina = new Servico { Nome = "Corte raspado máquina", DuracaoMinutos = 30,  Preco = 35m,  Ativo = true };

                // ─── Serviços exclusivos do Gabriel ────────────────────────────────────
                var blindagem           = new Servico { Nome = "Blindagem",                   DuracaoMinutos = 90,  Preco = 220m, Ativo = true };
                var blindagemSelagem    = new Servico { Nome = "Blindagem / selagem",         DuracaoMinutos = 60,  Preco = 750m, Ativo = true };
                var corteVisagismo      = new Servico { Nome = "Corte com Visagismo",         DuracaoMinutos = 60,  Preco = 250m, Ativo = true };
                var corteBarbaVisagismo = new Servico { Nome = "Corte e Barba com Visagismo", DuracaoMinutos = 90,  Preco = 400m, Ativo = true };
                var depOrelhaEnariz     = new Servico { Nome = "Dep. orelha e nariz",         DuracaoMinutos = 30,  Preco = 0m,   Ativo = true }; // preço a consultar
                var pezinho             = new Servico { Nome = "Pezinho",                     DuracaoMinutos = 30,  Preco = 20m,  Ativo = true };
                var progressivaMasc     = new Servico { Nome = "Progressiva masculina",       DuracaoMinutos = 30,  Preco = 150m, Ativo = true };
                var sobrancelha         = new Servico { Nome = "Sobrancelha",                 DuracaoMinutos = 30,  Preco = 40m,  Ativo = true };

                // ─── Serviços exclusivos da Bárbara ────────────────────────────────────
                var adicionalMegaHair    = new Servico { Nome = "Adicional cabelo com mega hair",       DuracaoMinutos = 30,  Preco = 35m,  Ativo = true };
                var adicionalServico     = new Servico { Nome = "Adicional de serviço",                 DuracaoMinutos = 30,  Preco = 50m,  Ativo = true };
                var buco                 = new Servico { Nome = "Buço",                                 DuracaoMinutos = 15,  Preco = 25m,  Ativo = true };
                var chapinha             = new Servico { Nome = "Chapinha",                             DuracaoMinutos = 30,  Preco = 50m,  Ativo = true };
                var coloracaoPessoal     = new Servico { Nome = "Coloração pessoal",                   DuracaoMinutos = 120, Preco = 390m, Ativo = true };
                var comboCHE             = new Servico { Nome = "Combo Corte Com Hidratação e Escova",  DuracaoMinutos = 60,  Preco = 160m, Ativo = true };
                var comboMaoPe           = new Servico { Nome = "Combo mão e pé",                      DuracaoMinutos = 60,  Preco = 85m,  Ativo = true };
                var corteFranja          = new Servico { Nome = "Corte de franja",                     DuracaoMinutos = 30,  Preco = 40m,  Ativo = true };
                var corteFeminino        = new Servico { Nome = "Corte feminino",                      DuracaoMinutos = 60,  Preco = 95m,  Ativo = true };
                var escovasCurta         = new Servico { Nome = "Escova curta",                        DuracaoMinutos = 60,  Preco = 75m,  Ativo = true };
                var escovasCurtaBabyLiss = new Servico { Nome = "Escova Curto com baby liss",          DuracaoMinutos = 60,  Preco = 120m, Ativo = true };
                var escovaLonga          = new Servico { Nome = "Escova longa",                        DuracaoMinutos = 60,  Preco = 80m,  Ativo = true };
                var escovaMedia          = new Servico { Nome = "Escova media",                        DuracaoMinutos = 60,  Preco = 75m,  Ativo = true };
                var escovaMLBabyLiss     = new Servico { Nome = "Escova Medio/Longo com baby liss",    DuracaoMinutos = 60,  Preco = 130m, Ativo = true };
                var esmaltacaoGelMao     = new Servico { Nome = "Esmaltação em Gel mão",               DuracaoMinutos = 60,  Preco = 90m,  Ativo = true };
                var esmaltacaoGelPe      = new Servico { Nome = "Esmaltação em Gel pé",                DuracaoMinutos = 60,  Preco = 100m, Ativo = true };
                var hidratacaoCurtoMedio = new Servico { Nome = "Hidratação com Escova Curto e Medio", DuracaoMinutos = 60,  Preco = 120m, Ativo = true };
                var hidratacaoLongo      = new Servico { Nome = "Hidratação com Escova Longo",         DuracaoMinutos = 60,  Preco = 130m, Ativo = true };
                var lavadoSemEscova      = new Servico { Nome = "Lavado S/ escova",                    DuracaoMinutos = 30,  Preco = 30m,  Ativo = true };
                var maoFrancesinha       = new Servico { Nome = "Mão francesinha",                     DuracaoMinutos = 30,  Preco = 42m,  Ativo = true };
                var maoSimples           = new Servico { Nome = "Mão simples",                         DuracaoMinutos = 30,  Preco = 40m,  Ativo = true };
                var maquiagemExpress     = new Servico { Nome = "Maquiagem express",                   DuracaoMinutos = 60,  Preco = 130m, Ativo = true };
                var maquiagemFesta       = new Servico { Nome = "Maquiagem festa/com cílios",          DuracaoMinutos = 60,  Preco = 170m, Ativo = true };
                var peSimples            = new Servico { Nome = "Pé simples",                          DuracaoMinutos = 30,  Preco = 50m,  Ativo = true };
                var remocaoAlongamento   = new Servico { Nome = "Remoção Alongamento",                 DuracaoMinutos = 60,  Preco = 95m,  Ativo = true };
                var remocaoEsmaltacao    = new Servico { Nome = "Remoção de esmaltação em gel",        DuracaoMinutos = 30,  Preco = 40m,  Ativo = true };
                var sobrancelhaDesigner  = new Servico { Nome = "Sobrancelha designer",                DuracaoMinutos = 15,  Preco = 45m,  Ativo = true };
                var sobrancelhaExcesso   = new Servico { Nome = "Sobrancelha excesso",                 DuracaoMinutos = 15,  Preco = 35m,  Ativo = true };

                var todosServicos = new List<Servico>
                {
                    // compartilhados
                    barba, comboRaspadoBarba, corteEBarba, corteMasculino, corteRaspadoMaquina,
                    // Gabriel
                    blindagem, blindagemSelagem, corteVisagismo, corteBarbaVisagismo,
                    depOrelhaEnariz, pezinho, progressivaMasc, sobrancelha,
                    // Bárbara
                    adicionalMegaHair, adicionalServico, buco, chapinha, coloracaoPessoal,
                    comboCHE, comboMaoPe, corteFranja, corteFeminino,
                    escovasCurta, escovasCurtaBabyLiss, escovaLonga, escovaMedia, escovaMLBabyLiss,
                    esmaltacaoGelMao, esmaltacaoGelPe,
                    hidratacaoCurtoMedio, hidratacaoLongo,
                    lavadoSemEscova, maoFrancesinha, maoSimples,
                    maquiagemExpress, maquiagemFesta,
                    peSimples, remocaoAlongamento, remocaoEsmaltacao,
                    sobrancelhaDesigner, sobrancelhaExcesso
                };

                await servicosRepo.InserirMuitosAsync(todosServicos, cancellationToken);

                // ─── Profissionais ──────────────────────────────────────────────────────
                var profissionais = new List<Profissional>
                {
                    new()
                    {
                        Nome = "Gabriel",
                        Ativo = true,
                        ServicoIds =
                        [
                            // compartilhados
                            barba.Id, comboRaspadoBarba.Id, corteEBarba.Id,
                            corteMasculino.Id, corteRaspadoMaquina.Id,
                            // exclusivos
                            blindagem.Id, blindagemSelagem.Id, corteVisagismo.Id,
                            corteBarbaVisagismo.Id, depOrelhaEnariz.Id,
                            pezinho.Id, progressivaMasc.Id, sobrancelha.Id
                        ]
                    },
                    new()
                    {
                        Nome = "Bárbara",
                        Ativo = true,
                        ServicoIds =
                        [
                            // compartilhados
                            barba.Id, comboRaspadoBarba.Id, corteEBarba.Id,
                            corteMasculino.Id, corteRaspadoMaquina.Id,
                            // exclusivos
                            adicionalMegaHair.Id, adicionalServico.Id, buco.Id, chapinha.Id,
                            coloracaoPessoal.Id, comboCHE.Id, comboMaoPe.Id,
                            corteFranja.Id, corteFeminino.Id,
                            escovasCurta.Id, escovasCurtaBabyLiss.Id, escovaLonga.Id,
                            escovaMedia.Id, escovaMLBabyLiss.Id,
                            esmaltacaoGelMao.Id, esmaltacaoGelPe.Id,
                            hidratacaoCurtoMedio.Id, hidratacaoLongo.Id,
                            lavadoSemEscova.Id, maoFrancesinha.Id, maoSimples.Id,
                            maquiagemExpress.Id, maquiagemFesta.Id,
                            peSimples.Id, remocaoAlongamento.Id, remocaoEsmaltacao.Id,
                            sobrancelhaDesigner.Id, sobrancelhaExcesso.Id
                        ]
                    }
                };

                await profissionaisRepo.InserirMuitosAsync(profissionais, cancellationToken);

                _logger.LogInformation(
                    "Catálogo criado: {TotalServicos} serviços e 2 profissionais (Gabriel e Bárbara).",
                    todosServicos.Count);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Não foi possível popular o catálogo. Verifique se o MongoDB está no ar.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
