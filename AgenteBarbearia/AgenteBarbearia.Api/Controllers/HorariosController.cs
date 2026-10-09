using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HorariosController : ControllerBase
    {
        private readonly AgendaService _agenda;

        public HorariosController(AgendaService agenda)
        {
            _agenda = agenda;
        }

        [HttpGet]
        public async Task<IActionResult> GetAsync(
            [FromQuery] DateOnly data,
            [FromQuery] string servicoId,
            [FromQuery] string? profissionalId,
            CancellationToken cancellationToken)
        {
            if (data == default)
                return BadRequest(new { message = "Informe a data no formato YYYY-MM-DD." });

            if (string.IsNullOrWhiteSpace(servicoId))
                return BadRequest(new { message = "Informe o servicoId." });

            var resultado = await _agenda.ConsultarHorariosAsync(data, servicoId, profissionalId, cancellationToken);
            return this.ParaActionResult(resultado);
        }
    }
}
