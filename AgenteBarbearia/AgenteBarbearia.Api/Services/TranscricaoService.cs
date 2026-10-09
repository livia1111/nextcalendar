using OpenAI.Audio;

namespace AgenteBarbearia.Api.Services
{
    /// <summary>
    /// Transcreve audios do WhatsApp usando OpenAI Whisper.
    /// </summary>
    public class TranscricaoService
    {
        private readonly AudioClient _audioClient;
        private readonly ILogger<TranscricaoService> _logger;

        public TranscricaoService(AudioClient audioClient, ILogger<TranscricaoService> logger)
        {
            _audioClient = audioClient;
            _logger = logger;
        }

        /// <summary>
        /// Recebe o audio em base64, envia ao Whisper e retorna o texto transcrito.
        /// </summary>
        public async Task<string?> TranscreverAsync(string audioBase64, string mimeType, CancellationToken cancellationToken = default)
        {
            try
            {
                var bytes = Convert.FromBase64String(audioBase64);
                var extensao = ObterExtensao(mimeType);

                using var stream = new MemoryStream(bytes);

                _logger.LogInformation("Transcrevendo audio ({Bytes} bytes, {Mime})...", bytes.Length, mimeType);

                var resultado = await _audioClient.TranscribeAudioAsync(
                    stream,
                    $"audio.{extensao}",
                    new AudioTranscriptionOptions
                    {
                        Language = "pt",
                        ResponseFormat = AudioTranscriptionFormat.Text
                    },
                    cancellationToken);

                var texto = resultado.Value.Text?.Trim();
                _logger.LogInformation("Transcricao: {Texto}", texto);
                return texto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao transcrever audio.");
                return null;
            }
        }

        private static string ObterExtensao(string mimeType) => mimeType.ToLower() switch
        {
            var m when m.Contains("ogg")  => "ogg",
            var m when m.Contains("mp4")  => "mp4",
            var m when m.Contains("webm") => "webm",
            var m when m.Contains("mp3")  => "mp3",
            var m when m.Contains("wav")  => "wav",
            var m when m.Contains("m4a")  => "m4a",
            _                             => "ogg"
        };
    }
}
