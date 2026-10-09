namespace AgenteBarbearia.Api.Services
{
    public enum FalhaAgenda
    {
        Nenhuma,
        Validacao,
        NaoEncontrado,
        Conflito,
        NaoAutorizado
    }

    public class ResultadoAgenda<T>
    {
        public bool Sucesso { get; init; }
        public string Mensagem { get; init; } = string.Empty;
        public T? Dados { get; init; }
        public FalhaAgenda TipoFalha { get; init; } = FalhaAgenda.Nenhuma;

        public static ResultadoAgenda<T> Ok(T dados, string mensagem = "")
            => new()
            {
                Sucesso = true,
                Dados = dados,
                Mensagem = mensagem
            };

        public static ResultadoAgenda<T> Falha(string mensagem, FalhaAgenda tipo)
            => new()
            {
                Sucesso = false,
                Mensagem = mensagem,
                TipoFalha = tipo
            };
    }
}
