using AgenteBarbearia.Api.Options;
using AgenteBarbearia.Api.Repositories;
using AgenteBarbearia.Api.Services;
using OpenAI.Audio;
using OpenAI.Chat;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<BarbeariaOptions>(
    builder.Configuration.GetSection(BarbeariaOptions.SectionName));

builder.Services.AddSingleton(sp =>
{
    var chaveApi = builder.Configuration.GetSection("OpenAI:Key").Value!;
    var modelo   = builder.Configuration.GetSection("OpenAI:Model").Value!;
    return new ChatClient(model: modelo, apiKey: chaveApi);
});


// AudioClient (Whisper) para transcrição de áudios
builder.Services.AddSingleton(sp =>
{
    var chaveApi = builder.Configuration.GetSection("OpenAI:Key").Value!;
    return new AudioClient(model: "whisper-1", apiKey: chaveApi);
});

builder.Services.AddSingleton<MongoContext>();
builder.Services.AddScoped<AtendimentoRepository>();
builder.Services.AddScoped<ServicoRepository>();
builder.Services.AddScoped<ProfissionalRepository>();
builder.Services.AddScoped<AgendamentoRepository>();
builder.Services.AddScoped<AgendaService>();
builder.Services.AddScoped<AgenteBarbeariaService>();
builder.Services.AddScoped<TranscricaoService>();
builder.Services.AddHostedService<BarbeariaSeed>();
builder.Services.AddHostedService<LembretesService>();

// WhatsApp — bridge local (Node.js / Baileys) em http://localhost:3001
builder.Services.AddHttpClient<WhatsAppService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthorization();
app.MapControllers();
app.Run();
