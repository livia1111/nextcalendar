namespace AgenteBarbearia.Api.Dtos
{
    /// <summary>
    /// DTO para a requisição de novo atendimento do suporte.
    /// imagemBase64 e imagemMimeType são opcionais — preenchidos quando o cliente envia uma foto.
    /// </summary>
    public record AtendimentoSuporteRequest(
            string nomeUsuario,
            string mensagem,
            DateTime? dataReferencia = null,
            string? imagemBase64 = null,
            string? imagemMimeType = null
        );
}
