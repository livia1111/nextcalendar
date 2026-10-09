using System.Text.RegularExpressions;
using AgenteBarbearia.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AgenteBarbearia.Api.Repositories
{
    public class AgendamentoRepository
    {
        private readonly IMongoCollection<Agendamento> _agendamentos;

        public AgendamentoRepository(MongoContext context)
        {
            _agendamentos = context.Agendamentos;
        }

        public Task InserirAsync(Agendamento agendamento, CancellationToken cancellationToken = default)
        {
            return _agendamentos.InsertOneAsync(agendamento, cancellationToken: cancellationToken);
        }

        public async Task<Agendamento?> ObterPorIdAsync(ObjectId id, CancellationToken cancellationToken = default)
        {
            return await _agendamentos.Find(a => a.Id == id).FirstOrDefaultAsync(cancellationToken);
        }

        public Task<List<Agendamento>> ListarPorClienteAsync(string nomeCliente, CancellationToken cancellationToken = default)
        {
            var filtro = Builders<Agendamento>.Filter.Regex(
                a => a.NomeCliente,
                new BsonRegularExpression($"^{Regex.Escape(nomeCliente)}$", "i"));

            return _agendamentos
                .Find(filtro)
                .SortByDescending(a => a.Inicio)
                .ToListAsync(cancellationToken);
        }

        public Task<List<Agendamento>> ListarAgendadosNoPeriodoAsync(
            ObjectId profissionalId,
            DateTime inicio,
            DateTime fim,
            CancellationToken cancellationToken = default)
        {
            return _agendamentos
                .Find(a =>
                    a.ProfissionalId == profissionalId &&
                    a.Status == StatusAgendamento.Agendado &&
                    a.Inicio < fim &&
                    a.Fim > inicio)
                .ToListAsync(cancellationToken);
        }

        public Task AtualizarAsync(Agendamento agendamento, CancellationToken cancellationToken = default)
        {
            return _agendamentos.ReplaceOneAsync(
                a => a.Id == agendamento.Id,
                agendamento,
                cancellationToken: cancellationToken);
        }

        /// <summary>
        /// Lista todos os agendamentos com status Agendado dentro do intervalo [inicio, fim),
        /// independente do profissional. Usado pelo serviço de lembretes.
        /// </summary>
        public Task<List<Agendamento>> ListarAgendadosNaDataAsync(
            DateTime inicio,
            DateTime fim,
            CancellationToken cancellationToken = default)
        {
            return _agendamentos
                .Find(a =>
                    a.Status == StatusAgendamento.Agendado &&
                    a.Inicio >= inicio &&
                    a.Inicio < fim)
                .SortBy(a => a.Inicio)
                .ToListAsync(cancellationToken);
        }
    }
}
