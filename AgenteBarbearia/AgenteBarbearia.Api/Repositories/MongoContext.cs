using AgenteBarbearia.Api.Models;
using MongoDB.Driver;

namespace AgenteBarbearia.Api.Repositories
{
    public class MongoContext
    {
        public IMongoCollection<HistoricoAtendimento> Historicos { get; }
        public IMongoCollection<Servico> Servicos { get; }
        public IMongoCollection<Profissional> Profissionais { get; }
        public IMongoCollection<Agendamento> Agendamentos { get; }

        public MongoContext(IConfiguration configuration)
        {
            var client = new MongoClient(configuration.GetSection("Mongo:ConnectionString").Value!);
            var database = client.GetDatabase(configuration.GetSection("Mongo:Database").Value!);

            Historicos = database.GetCollection<HistoricoAtendimento>(
                configuration.GetSection("Mongo:Collection").Value ?? "historico_atendimento");
            Servicos = database.GetCollection<Servico>("servicos");
            Profissionais = database.GetCollection<Profissional>("profissionais");
            Agendamentos = database.GetCollection<Agendamento>("agendamentos");
        }
    }
}
