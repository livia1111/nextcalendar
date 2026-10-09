using System.Text;
using System.Text.Json;

namespace AgenteBarbearia.Api.Services
{
    /// <summary>
    /// Envia mensagens de texto ao cliente via whatsapp-bridge local (Node.js / Baileys).
    /// </summary>
    public class WhatsAppService
    {
        private readonly HttpClient _http;
        private readonly ILogger<WhatsAppService> _logger;

        // Endpoint do whatsapp-bridge rodando em http://localhost:3001
        private const string BridgeUrl = "http://localhost:3001/send";

        private static readonly JsonSerializerOptions JsonOpcoes = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public WhatsAppService(HttpClient http, ILogger<WhatsAppService> logger)
        {
            _http = http;
            _logger = logger;
        }

        /// <summary>
        /// Envia uma mensagem de texto para o número informado.
        /// </summary>
        /// <param name="numero">Número no formato: 5511999999999 ou JID completo</param>
        /// <param name="texto">Texto a ser enviado ao cliente.</param>
        public async Task EnviarMensagemAsync(string numero, string texto, CancellationToken cancellationToken = default)
        {
            // Aceita número puro ou JID completo (5511999999999@s.whatsapp.net)
            var numberFormatado = numero.Contains('@') ? numero.Split('@')[0] : numero;

            var payload = new
            {
                number = numberFormatado,
                text = texto
            };

            var json = JsonSerializer.Serialize(payload, JsonOpcoes);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                var response = await _http.PostAsync(BridgeUrl, content, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Bridge retornou {Status}: {Body}", response.StatusCode, body);
                }
                else
                {
                    _logger.LogInformation("Mensagem enviada para {Numero}", numberFormatado);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao chamar o whatsapp-bridge para {Numero}", numberFormatado);
            }
        }
    }
}
