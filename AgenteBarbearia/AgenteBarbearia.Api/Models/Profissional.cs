using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AgenteBarbearia.Api.Models
{
    public class Profissional
    {
        [BsonId]
        public ObjectId Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public List<ObjectId> ServicoIds { get; set; } = [];
        public bool Ativo { get; set; } = true;
    }
}
