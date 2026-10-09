using AgenteBarbearia.Api.Models;
using MongoDB.Driver;

namespace AgenteBarbearia.Api.Repositories
{
    /// <summary>
    /// Classe de repositório para implementar operações no banco de dados do MongoDB
    /// com a collection 'HistoricoAtendimento'
    /// </summary>
    public class AtendimentoRepository
    {
        private readonly IMongoCollection<HistoricoAtendimento> _historicoAtendimentos;

        public AtendimentoRepository(MongoContext context)
        {
            _historicoAtendimentos = context.Historicos;
        }

        /// <summary>
        /// Salvar um histórico de atendimento
        /// </summary>
        public async Task SalvarHistoricoAtendimento(HistoricoAtendimento historicoAtendimento)
        {
            await _historicoAtendimentos.InsertOneAsync(historicoAtendimento);
        }

        /// <summary>
        /// Obter os ultimos históricos de atendimento de um determinado usuário
        /// </summary>
        public async Task<List<HistoricoAtendimento>> ObterHistoricosAtendimento(
                string nomeUsuario,
                int quantidade = 3
            )
        {
            return await _historicoAtendimentos
                .Find(h => h.NomeUsuario.Equals(nomeUsuario))
                .SortByDescending(h => h.DataHora)
                .Limit(quantidade)
                .ToListAsync();
        }

        /// <summary>
        /// Retorna o nome real do cliente (informado em algum atendimento anterior).
        /// Retorna null se o cliente nunca informou o nome.
        /// </summary>
        public async Task<string?> ObterNomeRealAsync(string numero)
        {
            var registro = await _historicoAtendimentos
                .Find(h => h.NomeUsuario == numero && h.NomeReal != string.Empty)
                .SortByDescending(h => h.DataHora)
                .FirstOrDefaultAsync();

            return string.IsNullOrWhiteSpace(registro?.NomeReal) ? null : registro.NomeReal;
        }
    }
}
