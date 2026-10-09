namespace AgenteBarbearia.Api.Options
{
    public class WhatsAppOptions
    {
        public const string SectionName = "WhatsApp";

        /// <summary>URL base da Evolution API. Ex: http://localhost:8080</summary>
        public string BaseUrl { get; set; } = "http://localhost:8080";

        /// <summary>API Key configurada na Evolution API.</summary>
        public string ApiKey { get; set; } = "";

        /// <summary>Nome da instância criada na Evolution API. Ex: studio-vision</summary>
        public string Instance { get; set; } = "studio-vision";
    }
}
