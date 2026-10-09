using AgenteBarbearia.Api.Dtos;
using AgenteBarbearia.Api.Models;
using AgenteBarbearia.Api.Repositories;
using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AtendimentoController : ControllerBase
    {
        private readonly AgenteBarbeariaService _service;
        private readonly AtendimentoRepository _repository;

        public AtendimentoController(AgenteBarbeariaService service, AtendimentoRepository repository)
        {
            _service = service;
            _repository = repository;
        }

        [HttpPost]
        public async Task<IActionResult> PostAsync(
                [FromBody] AtendimentoSuporteRequest request,
                CancellationToken cancellationToken
            )
        {
            if (string.IsNullOrEmpty(request.nomeUsuario))
                return BadRequest(new { message = "O nome do usuário é obrigatório." });

            if (string.IsNullOrEmpty(request.mensagem))
                return BadRequest(new { message = "A mensagem é obrigatória." });

            var historicos = await _repository.ObterHistoricosAtendimento(request.nomeUsuario);

            var respostaAgente = await _service.GerarRespostaAsync(request, historicos, cancellationToken);

            var atendimento = new HistoricoAtendimento
            {
                NomeUsuario = request.nomeUsuario,
                MensagemUsuario = request.mensagem,
                RespostaAgente = respostaAgente,
                DataHora = DateTime.Now
            };

            await _repository.SalvarHistoricoAtendimento(atendimento);

            return StatusCode(201, respostaAgente);
        }
    }
}
