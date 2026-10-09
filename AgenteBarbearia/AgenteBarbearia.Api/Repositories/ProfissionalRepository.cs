using AgenteBarbearia.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AgenteBarbearia.Api.Repositories
{
    public class ProfissionalRepository
    {
        private readonly IMongoCollection<Profissional> _profissionais;

        public ProfissionalRepository(MongoContext context)
        {
            _profissionais = context.Profissionais;
        }

        public Task<List<Profissional>> ListarAtivosAsync(CancellationToken cancellationToken = default)
        {
            return _profissionais
                .Find(p => p.Ativo)
                .SortBy(p => p.Nome)
                .ToListAsync(cancellationToken);
        }

        public async Task<Profissional?> ObterPorIdAsync(ObjectId id, CancellationToken cancellationToken = default)
        {
            return await _profissionais.Find(p => p.Id == id).FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<Profissional?> ObterPorNomeAsync(string nome, CancellationToken cancellationToken = default)
        {
            var filtro = Builders<Profissional>.Filter.Regex(
                p => p.Nome,
                new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(nome)}$", "i"));

            return await _profissionais.Find(filtro).FirstOrDefaultAsync(cancellationToken);
        }

        public Task<long> ContarAsync(CancellationToken cancellationToken = default)
        {
            return _profissionais.CountDocumentsAsync(FilterDefinition<Profissional>.Empty, cancellationToken: cancellationToken);
        }

        public Task InserirMuitosAsync(IEnumerable<Profissional> profissionais, CancellationToken cancellationToken = default)
        {
            return _profissionais.InsertManyAsync(profissionais, cancellationToken: cancellationToken);
        }
    }
}
