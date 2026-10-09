namespace AgenteBarbearia.Api.Dtos
{
    public record ServicoResponse(
        string Id,
        string Nome,
        int DuracaoMinutos,
        decimal Preco);

    public record ServicoResumoResponse(
        string Id,
        string Nome);

    public record ProfissionalResponse(
        string Id,
        string Nome,
        IReadOnlyList<ServicoResumoResponse> Servicos);

    public record HorarioDisponivelResponse(
        string ProfissionalId,
        string ProfissionalNome,
        DateTime Inicio,
        DateTime Fim);

    public record AgendamentoResponse(
        string Id,
        string NomeCliente,
        string ProfissionalId,
        string ProfissionalNome,
        string ServicoId,
        string ServicoNome,
        DateTime Inicio,
        DateTime Fim,
        string Status);

    public record CriarAgendamentoRequest(
        string NomeUsuario,
        string ServicoId,
        string ProfissionalId,
        DateTime Inicio);

    public record RemarcarAgendamentoRequest(
        string NomeUsuario,
        DateTime Inicio);

    public record CancelarAgendamentoRequest(
        string NomeUsuario);
}
