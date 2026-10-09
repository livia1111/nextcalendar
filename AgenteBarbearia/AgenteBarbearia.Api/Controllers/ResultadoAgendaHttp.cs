using AgenteBarbearia.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgenteBarbearia.Api.Controllers
{
    internal static class ResultadoAgendaHttp
    {
        public static IActionResult ParaActionResult<T>(
            this ControllerBase controller,
            ResultadoAgenda<T> resultado,
            int statusSucesso = StatusCodes.Status200OK)
        {
            if (resultado.Sucesso)
                return controller.StatusCode(statusSucesso, resultado.Dados);

            var body = new { message = resultado.Mensagem };
            return resultado.TipoFalha switch
            {
                FalhaAgenda.NaoEncontrado => controller.NotFound(body),
                FalhaAgenda.Conflito => controller.Conflict(body),
                FalhaAgenda.NaoAutorizado => controller.StatusCode(StatusCodes.Status403Forbidden, body),
                _ => controller.BadRequest(body)
            };
        }
    }
}
