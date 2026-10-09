using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AgenteBarbearia.Api.Models
{
    public class Servico
    {
        [BsonId]
        public ObjectId Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public int DuracaoMinutos { get; set; }
        public decimal Preco { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
