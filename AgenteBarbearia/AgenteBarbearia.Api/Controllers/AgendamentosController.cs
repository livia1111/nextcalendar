using AgenteBarbearia.Api.Dtos;
using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AgendamentosController : ControllerBase
    {
        private readonly AgendaService _agenda;

        public AgendamentosController(AgendaService agenda)
        {
            _agenda = agenda;
        }

        [HttpGet]
        public async Task<IActionResult> GetAsync(
            [FromQuery] string nomeUsuario,
            CancellationToken cancellationToken)
        {
            var resultado = await _agenda.ListarAgendamentosClienteAsync(nomeUsuario, cancellationToken);
            return this.ParaActionResult(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> PostAsync(
            [FromBody] CriarAgendamentoRequest request,
            CancellationToken cancellationToken)
        {
            var resultado = await _agenda.CriarAgendamentoAsync(
                request.NomeUsuario,
                request.ServicoId,
                request.ProfissionalId,
                request.Inicio,
                cancellationToken);

            return this.ParaActionResult(resultado, StatusCodes.Status201Created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAsync(
            string id,
            [FromBody] RemarcarAgendamentoRequest request,
            CancellationToken cancellationToken)
        {
            var resultado = await _agenda.RemarcarAgendamentoAsync(
                id,
                request.NomeUsuario,
                request.Inicio,
                cancellationToken);

            return this.ParaActionResult(resultado);
        }

        [HttpPost("{id}/cancelar")]
        public async Task<IActionResult> CancelarAsync(
            string id,
            [FromBody] CancelarAgendamentoRequest request,
            CancellationToken cancellationToken)
        {
            var resultado = await _agenda.CancelarAgendamentoAsync(
                id,
                request.NomeUsuario,
                cancellationToken);

            return this.ParaActionResult(resultado);
        }
    }
}
