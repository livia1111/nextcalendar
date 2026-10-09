using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicosController : ControllerBase
    {
        private readonly AgendaService _agenda;

        public ServicosController(AgendaService agenda)
        {
            _agenda = agenda;
        }

        [HttpGet]
        public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
        {
            var servicos = await _agenda.ListarServicosAsync(cancellationToken);
            return Ok(servicos);
        }
    }
}
