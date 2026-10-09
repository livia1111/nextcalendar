using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfissionaisController : ControllerBase
    {
        private readonly AgendaService _agenda;

        public ProfissionaisController(AgendaService agenda)
        {
            _agenda = agenda;
        }

        [HttpGet]
        public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
        {
            var profissionais = await _agenda.ListarProfissionaisAsync(cancellationToken);
            return Ok(profissionais);
        }
    }
}
