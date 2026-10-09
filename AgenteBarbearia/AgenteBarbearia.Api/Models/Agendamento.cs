using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AgenteBarbearia.Api.Models
{
    public class Agendamento
    {
        [BsonId]
        public ObjectId Id { get; set; }
        public string NomeCliente { get; set; } = string.Empty;
        public ObjectId ProfissionalId { get; set; }
        public ObjectId ServicoId { get; set; }
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }
        public string Status { get; set; } = StatusAgendamento.Agendado;
    }
}
