namespace AgenteBarbearia.Api.Dtos
{
    /// <summary>
    /// DTO para a resposta de novo atendimento do suporte
    /// </summary>
    public record AtendimentoSuporteResponse(
            string usuario,
            string intencao,
            string resposta,
            string sentimento,
            string proximaAcao,
            string acaoExecutada,
            string agendamentoId,
            EncaminhamentoAtendimento encaminhamento
        );

    /// <summary>
    /// DTO para definir se há a necessidade de encaminhar
    /// o atendimento para um atendente humano
    /// </summary>
    public record EncaminhamentoAtendimento(
            bool necessario,
            string agenteDestino,
            string motivo
        );
}
