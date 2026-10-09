using System.Globalization;
using AgenteBarbearia.Api.Dtos;
using AgenteBarbearia.Api.Models;
using AgenteBarbearia.Api.Options;
using AgenteBarbearia.Api.Repositories;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace AgenteBarbearia.Api.Services
{
    public class AgendaService
    {
        private readonly ServicoRepository _servicos;
        private readonly ProfissionalRepository _profissionais;
        private readonly AgendamentoRepository _agendamentos;
        private readonly BarbeariaOptions _barbearia;

        public AgendaService(
            ServicoRepository servicos,
            ProfissionalRepository profissionais,
            AgendamentoRepository agendamentos,
            IOptions<BarbeariaOptions> barbearia)
        {
            _servicos = servicos;
            _profissionais = profissionais;
            _agendamentos = agendamentos;
            _barbearia = barbearia.Value;
        }

        public async Task<List<ServicoResponse>> ListarServicosAsync(CancellationToken cancellationToken = default)
        {
            var servicos = await _servicos.ListarAtivosAsync(cancellationToken);
            return servicos.Select(MapearServico).ToList();
        }

        public async Task<List<ProfissionalResponse>> ListarProfissionaisAsync(CancellationToken cancellationToken = default)
        {
            var profissionais = await _profissionais.ListarAtivosAsync(cancellationToken);
            var servicos = await _servicos.ListarAtivosAsync(cancellationToken);
            var porId = servicos.ToDictionary(s => s.Id);

            return profissionais.Select(p => new ProfissionalResponse(
                p.Id.ToString(),
                p.Nome,
                p.ServicoIds
                    .Where(porId.ContainsKey)
                    .Select(id => new ServicoResumoResponse(id.ToString(), porId[id].Nome))
                    .ToList()
            )).ToList();
        }

        public object ObterFuncionamento()
        {
            var dias = _barbearia.DiasFuncionamento
                .Select(d => NomeDia((DayOfWeek)d))
                .ToList();

            return new
            {
                nome = _barbearia.Nome,
                diasFuncionamento = dias,
                abre = _barbearia.Abre,
                fecha = _barbearia.Fecha,
                intervaloAlmocoInicio = _barbearia.IntervaloAlmocoInicio,
                intervaloAlmocoFim = _barbearia.IntervaloAlmocoFim
            };
        }

        public async Task<ResultadoAgenda<List<HorarioDisponivelResponse>>> ConsultarHorariosAsync(
            DateOnly data,
            string servicoRef,
            string? profissionalRef,
            CancellationToken cancellationToken = default)
        {
            var servico = await ResolverServicoAsync(servicoRef, cancellationToken);
            if (servico is null || !servico.Ativo)
                return ResultadoAgenda<List<HorarioDisponivelResponse>>.Falha(
                    "Serviço não encontrado. Informe o nome ou o id de um serviço ativo.",
                    FalhaAgenda.NaoEncontrado);

            if (!EstaAberto(data))
            {
                return ResultadoAgenda<List<HorarioDisponivelResponse>>.Ok(
                    [],
                    $"{_barbearia.Nome} não abre em {NomeDia(data.DayOfWeek)}.");
            }

            List<Profissional> profissionais;
            if (!string.IsNullOrWhiteSpace(profissionalRef))
            {
                var profissional = await ResolverProfissionalAsync(profissionalRef, cancellationToken);
                if (profissional is null || !profissional.Ativo)
                    return ResultadoAgenda<List<HorarioDisponivelResponse>>.Falha(
                        "Profissional não encontrado.",
                        FalhaAgenda.NaoEncontrado);

                if (!profissional.ServicoIds.Contains(servico.Id))
                    return ResultadoAgenda<List<HorarioDisponivelResponse>>.Falha(
                        $"{profissional.Nome} não realiza o serviço {servico.Nome}.",
                        FalhaAgenda.Validacao);

                profissionais = [profissional];
            }
            else
            {
                profissionais = (await _profissionais.ListarAtivosAsync(cancellationToken))
                    .Where(p => p.ServicoIds.Contains(servico.Id))
                    .ToList();
            }

            var slots = new List<HorarioDisponivelResponse>();
            foreach (var profissional in profissionais)
            {
                slots.AddRange(await GerarSlotsAsync(data, servico, profissional, cancellationToken));
            }

            var mensagem = slots.Count == 0
                ? "Não há horários disponíveis para essa data."
                : $"{slots.Count} horário(s) disponível(is).";

            return ResultadoAgenda<List<HorarioDisponivelResponse>>.Ok(slots, mensagem);
        }

        public async Task<ResultadoAgenda<List<AgendamentoResponse>>> ListarAgendamentosClienteAsync(
            string nomeUsuario,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(nomeUsuario))
                return ResultadoAgenda<List<AgendamentoResponse>>.Falha(
                    "O nome do usuário é obrigatório.",
                    FalhaAgenda.Validacao);

            var agendamentos = await _agendamentos.ListarPorClienteAsync(nomeUsuario, cancellationToken);
            var respostas = new List<AgendamentoResponse>();
            foreach (var agendamento in agendamentos)
            {
                respostas.Add(await MapearAgendamentoAsync(agendamento, cancellationToken));
            }

            return ResultadoAgenda<List<AgendamentoResponse>>.Ok(respostas);
        }

        public async Task<ResultadoAgenda<AgendamentoResponse>> CriarAgendamentoAsync(
            string nomeUsuario,
            string servicoRef,
            string profissionalRef,
            DateTime inicio,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(nomeUsuario))
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    "O nome do usuário é obrigatório.",
                    FalhaAgenda.Validacao);

            var servico = await ResolverServicoAsync(servicoRef, cancellationToken);
            if (servico is null || !servico.Ativo)
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    "Serviço não encontrado.",
                    FalhaAgenda.NaoEncontrado);

            var profissional = await ResolverProfissionalAsync(profissionalRef, cancellationToken);
            if (profissional is null || !profissional.Ativo)
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    "Profissional não encontrado.",
                    FalhaAgenda.NaoEncontrado);

            if (!profissional.ServicoIds.Contains(servico.Id))
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    $"{profissional.Nome} não realiza o serviço {servico.Nome}.",
                    FalhaAgenda.Validacao);

            var inicioNormalizado = NormalizarHorario(inicio);
            var validacao = await ValidarSlotAsync(inicioNormalizado, servico, profissional, ignorarAgendamentoId: null, cancellationToken);
            if (!validacao.Sucesso)
                return ResultadoAgenda<AgendamentoResponse>.Falha(validacao.Mensagem, validacao.TipoFalha);

            var agendamento = new Agendamento
            {
                NomeCliente = nomeUsuario.Trim(),
                ProfissionalId = profissional.Id,
                ServicoId = servico.Id,
                Inicio = inicioNormalizado,
                Fim = inicioNormalizado.AddMinutes(servico.DuracaoMinutos),
                Status = StatusAgendamento.Agendado
            };

            await _agendamentos.InserirAsync(agendamento, cancellationToken);
            var resposta = await MapearAgendamentoAsync(agendamento, cancellationToken);
            return ResultadoAgenda<AgendamentoResponse>.Ok(resposta, "Agendamento confirmado.");
        }

        public async Task<ResultadoAgenda<AgendamentoResponse>> CancelarAgendamentoAsync(
            string agendamentoId,
            string nomeUsuario,
            CancellationToken cancellationToken = default)
        {
            var agendamento = await ObterAgendamentoDoClienteAsync(agendamentoId, nomeUsuario, cancellationToken);
            if (!agendamento.Sucesso)
                return ResultadoAgenda<AgendamentoResponse>.Falha(agendamento.Mensagem, agendamento.TipoFalha);

            var atual = agendamento.Dados!;
            if (atual.Status == StatusAgendamento.Cancelado)
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    "Esse agendamento já está cancelado.",
                    FalhaAgenda.Validacao);

            atual.Status = StatusAgendamento.Cancelado;
            await _agendamentos.AtualizarAsync(atual, cancellationToken);
            var resposta = await MapearAgendamentoAsync(atual, cancellationToken);
            return ResultadoAgenda<AgendamentoResponse>.Ok(resposta, "Agendamento cancelado.");
        }

        public async Task<ResultadoAgenda<AgendamentoResponse>> RemarcarAgendamentoAsync(
            string agendamentoId,
            string nomeUsuario,
            DateTime novoInicio,
            CancellationToken cancellationToken = default)
        {
            var agendamento = await ObterAgendamentoDoClienteAsync(agendamentoId, nomeUsuario, cancellationToken);
            if (!agendamento.Sucesso)
                return ResultadoAgenda<AgendamentoResponse>.Falha(agendamento.Mensagem, agendamento.TipoFalha);

            var atual = agendamento.Dados!;
            if (atual.Status != StatusAgendamento.Agendado)
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    "Só é possível remarcar um agendamento ativo.",
                    FalhaAgenda.Validacao);

            var servico = await _servicos.ObterPorIdAsync(atual.ServicoId, cancellationToken);
            var profissional = await _profissionais.ObterPorIdAsync(atual.ProfissionalId, cancellationToken);
            if (servico is null || profissional is null)
                return ResultadoAgenda<AgendamentoResponse>.Falha(
                    "Não foi possível remarcar: serviço ou profissional indisponível.",
                    FalhaAgenda.NaoEncontrado);

            var inicioNormalizado = NormalizarHorario(novoInicio);
            var validacao = await ValidarSlotAsync(inicioNormalizado, servico, profissional, atual.Id, cancellationToken);
            if (!validacao.Sucesso)
                return ResultadoAgenda<AgendamentoResponse>.Falha(validacao.Mensagem, validacao.TipoFalha);

            atual.Inicio = inicioNormalizado;
            atual.Fim = inicioNormalizado.AddMinutes(servico.DuracaoMinutos);
            await _agendamentos.AtualizarAsync(atual, cancellationToken);

            var resposta = await MapearAgendamentoAsync(atual, cancellationToken);
            return ResultadoAgenda<AgendamentoResponse>.Ok(resposta, "Agendamento remarcado.");
        }

        public async Task<Servico?> ResolverServicoAsync(string valor, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            if (ObjectId.TryParse(valor, out var id))
                return await _servicos.ObterPorIdAsync(id, cancellationToken);

            return await _servicos.ObterPorNomeAsync(valor.Trim(), cancellationToken);
        }

        public async Task<Profissional?> ResolverProfissionalAsync(string valor, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            if (ObjectId.TryParse(valor, out var id))
                return await _profissionais.ObterPorIdAsync(id, cancellationToken);

            return await _profissionais.ObterPorNomeAsync(valor.Trim(), cancellationToken);
        }

        private async Task<ResultadoAgenda<Agendamento>> ObterAgendamentoDoClienteAsync(
            string agendamentoId,
            string nomeUsuario,
            CancellationToken cancellationToken)
        {
            if (!ObjectId.TryParse(agendamentoId, out var id))
                return ResultadoAgenda<Agendamento>.Falha("Id de agendamento inválido.", FalhaAgenda.Validacao);

            if (string.IsNullOrWhiteSpace(nomeUsuario))
                return ResultadoAgenda<Agendamento>.Falha("O nome do usuário é obrigatório.", FalhaAgenda.Validacao);

            var agendamento = await _agendamentos.ObterPorIdAsync(id, cancellationToken);
            if (agendamento is null)
                return ResultadoAgenda<Agendamento>.Falha("Agendamento não encontrado.", FalhaAgenda.NaoEncontrado);

            if (!string.Equals(agendamento.NomeCliente, nomeUsuario.Trim(), StringComparison.OrdinalIgnoreCase))
                return ResultadoAgenda<Agendamento>.Falha(
                    "Este agendamento pertence a outro cliente.",
                    FalhaAgenda.NaoAutorizado);

            return ResultadoAgenda<Agendamento>.Ok(agendamento);
        }

        private async Task<ResultadoAgenda<bool>> ValidarSlotAsync(
            DateTime inicio,
            Servico servico,
            Profissional profissional,
            ObjectId? ignorarAgendamentoId,
            CancellationToken cancellationToken)
        {
            var data = DateOnly.FromDateTime(inicio);
            if (!EstaAberto(data))
                return ResultadoAgenda<bool>.Falha(
                    $"{_barbearia.Nome} não abre em {NomeDia(data.DayOfWeek)}.",
                    FalhaAgenda.Validacao);

            var slots = await GerarSlotsAsync(data, servico, profissional, cancellationToken, ignorarAgendamentoId);
            var existe = slots.Any(s => s.Inicio == inicio);
            if (!existe)
                return ResultadoAgenda<bool>.Falha(
                    "Esse horário não está disponível. Consulte as vagas antes de confirmar.",
                    FalhaAgenda.Conflito);

            return ResultadoAgenda<bool>.Ok(true);
        }

        private async Task<List<HorarioDisponivelResponse>> GerarSlotsAsync(
            DateOnly data,
            Servico servico,
            Profissional profissional,
            CancellationToken cancellationToken,
            ObjectId? ignorarAgendamentoId = null)
        {
            var abre = ParseHora(_barbearia.Abre);
            var fecha = ParseHora(_barbearia.Fecha);
            var almocoInicio = ParseHora(_barbearia.IntervaloAlmocoInicio);
            var almocoFim = ParseHora(_barbearia.IntervaloAlmocoFim);
            var duracao = TimeSpan.FromMinutes(servico.DuracaoMinutos);
            var passo = TimeSpan.FromMinutes(_barbearia.SlotMinutos > 0 ? _barbearia.SlotMinutos : 30);

            var inicioDia = NormalizarHorario(data.ToDateTime(TimeOnly.MinValue));
            var fimDia = inicioDia.AddDays(1);
            var ocupados = await _agendamentos.ListarAgendadosNoPeriodoAsync(
                profissional.Id,
                inicioDia,
                fimDia,
                cancellationToken);

            if (ignorarAgendamentoId is ObjectId ignorar)
                ocupados = ocupados.Where(a => a.Id != ignorar).ToList();

            var slots = new List<HorarioDisponivelResponse>();
            for (var hora = abre; hora < fecha; hora = hora.Add(passo))
            {
                var fimHora = hora.Add(duracao);
                if (fimHora < hora)
                    continue;

                var cabeManha = hora >= abre && fimHora <= almocoInicio;
                var cabeTarde = hora >= almocoFim && fimHora <= fecha;
                if (!cabeManha && !cabeTarde)
                    continue;

                var inicio = NormalizarHorario(data.ToDateTime(hora));
                var fim = inicio.AddMinutes(servico.DuracaoMinutos);
                var conflito = ocupados.Any(a => a.Inicio < fim && a.Fim > inicio);
                if (conflito)
                    continue;

                slots.Add(new HorarioDisponivelResponse(
                    profissional.Id.ToString(),
                    profissional.Nome,
                    inicio,
                    fim));
            }

            return slots;
        }

        private bool EstaAberto(DateOnly data)
            => _barbearia.DiasFuncionamento.Contains((int)data.DayOfWeek);

        private static TimeOnly ParseHora(string valor)
            => TimeOnly.ParseExact(valor, "HH:mm", CultureInfo.InvariantCulture);

        private static DateTime NormalizarHorario(DateTime valor)
            => DateTime.SpecifyKind(new DateTime(valor.Year, valor.Month, valor.Day, valor.Hour, valor.Minute, 0), DateTimeKind.Utc);

        private static string NomeDia(DayOfWeek dia) => dia switch
        {
            DayOfWeek.Sunday => "domingo",
            DayOfWeek.Monday => "segunda-feira",
            DayOfWeek.Tuesday => "terça-feira",
            DayOfWeek.Wednesday => "quarta-feira",
            DayOfWeek.Thursday => "quinta-feira",
            DayOfWeek.Friday => "sexta-feira",
            _ => "sábado"
        };

        private static ServicoResponse MapearServico(Servico servico)
            => new(servico.Id.ToString(), servico.Nome, servico.DuracaoMinutos, servico.Preco);

        private async Task<AgendamentoResponse> MapearAgendamentoAsync(
            Agendamento agendamento,
            CancellationToken cancellationToken)
        {
            var profissional = await _profissionais.ObterPorIdAsync(agendamento.ProfissionalId, cancellationToken);
            var servico = await _servicos.ObterPorIdAsync(agendamento.ServicoId, cancellationToken);

            return new AgendamentoResponse(
                agendamento.Id.ToString(),
                agendamento.NomeCliente,
                agendamento.ProfissionalId.ToString(),
                profissional?.Nome ?? string.Empty,
                agendamento.ServicoId.ToString(),
                servico?.Nome ?? string.Empty,
                agendamento.Inicio,
                agendamento.Fim,
                agendamento.Status);
        }
    }
}
