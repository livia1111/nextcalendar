using AgenteBarbearia.Api.Dtos;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AgenteBarbearia.Api.Models
{
    /// <summary>
    /// Modelo de dados da collection do MongoDB:
    /// </summary>
    public class HistoricoAtendimento
    {
        [BsonId]
        public ObjectId Id { get; set; }

        /// <summary>Número de telefone (identificador único do cliente no WhatsApp).</summary>
        public string NomeUsuario { get; set; } = string.Empty;

        /// <summary>Nome real informado pelo cliente durante o atendimento.</summary>
        public string NomeReal { get; set; } = string.Empty;

        public string MensagemUsuario { get; set; } = string.Empty;
        public AtendimentoSuporteResponse? RespostaAgente { get; set; }
        public DateTime DataHora { get; set; }
    }
}
