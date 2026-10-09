using AgenteBarbearia.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AgenteBarbearia.Api.Repositories
{
    public class ServicoRepository
    {
        private readonly IMongoCollection<Servico> _servicos;

        public ServicoRepository(MongoContext context)
        {
            _servicos = context.Servicos;
        }

        public Task<List<Servico>> ListarAtivosAsync(CancellationToken cancellationToken = default)
        {
            return _servicos
                .Find(s => s.Ativo)
                .SortBy(s => s.Nome)
                .ToListAsync(cancellationToken);
        }

        public async Task<Servico?> ObterPorIdAsync(ObjectId id, CancellationToken cancellationToken = default)
        {
            return await _servicos.Find(s => s.Id == id).FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<Servico?> ObterPorNomeAsync(string nome, CancellationToken cancellationToken = default)
        {
            var filtro = Builders<Servico>.Filter.Regex(
                s => s.Nome,
                new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(nome)}$", "i"));

            return await _servicos.Find(filtro).FirstOrDefaultAsync(cancellationToken);
        }

        public Task<List<Servico>> ObterPorIdsAsync(IEnumerable<ObjectId> ids, CancellationToken cancellationToken = default)
        {
            return _servicos.Find(s => ids.Contains(s.Id)).ToListAsync(cancellationToken);
        }

        public Task<long> ContarAsync(CancellationToken cancellationToken = default)
        {
            return _servicos.CountDocumentsAsync(FilterDefinition<Servico>.Empty, cancellationToken: cancellationToken);
        }

        public Task InserirMuitosAsync(IEnumerable<Servico> servicos, CancellationToken cancellationToken = default)
        {
            return _servicos.InsertManyAsync(servicos, cancellationToken: cancellationToken);
        }
    }
}
