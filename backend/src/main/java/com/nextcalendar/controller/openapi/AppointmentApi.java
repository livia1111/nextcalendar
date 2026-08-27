package com.nextcalendar.controller.openapi;

import com.nextcalendar.dto.appointment.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Agendamentos", description = "Endpoints para consulta de disponibilidade e gerenciamento de agendamentos")
public interface AppointmentApi {

    @Operation(summary = "Consultar horários disponíveis", description = "Calcula os horários livres de um profissional para um serviço específico, numa data, considerando expediente, almoço, agendamentos e bloqueios existentes.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horários disponíveis retornados com sucesso"),
            @ApiResponse(responseCode = "400", description = "O profissional não atende neste dia da semana"),
            @ApiResponse(responseCode = "404", description = "Profissional, serviço ou estabelecimento não encontrado")
    })
    AvailableSlotsResponseDTO getAvailableSlots(UUID establishmentId, UUID professionalId, UUID serviceId, LocalDate date);

    @Operation(summary = "Criar agendamento", description = "Cria um novo agendamento, validando disponibilidade (expediente, almoço, bloqueios e conflitos), exceto quando marcado como encaixe.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Agendamento criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Horário fora do expediente, durante o almoço, bloqueado ou já ocupado"),
            @ApiResponse(responseCode = "404", description = "Profissional, serviço, cliente ou estabelecimento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    AppointmentResponseDTO createAppointment(UUID establishmentId, AppointmentCreateDTO dto);

    @Operation(summary = "Cancelar agendamento", description = "Cancela um agendamento existente, respeitando a antecedência mínima de 2 horas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Agendamento cancelado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Agendamento já cancelado, ou antecedência mínima não respeitada"),
            @ApiResponse(responseCode = "404", description = "Agendamento não encontrado")
    })
    AppointmentResponseDTO cancelAppointment(UUID establishmentId, UUID id);

    @Operation(summary = "Reagendar agendamento", description = "Move um agendamento existente para um novo horário, revalidando toda a disponibilidade.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Agendamento reagendado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Agendamento cancelado, ou novo horário indisponível"),
            @ApiResponse(responseCode = "404", description = "Agendamento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    AppointmentResponseDTO rescheduleAppointment(UUID establishmentId, UUID id, AppointmentRescheduleDTO dto);

    @Operation(summary = "Listar agendamentos do cliente", description = "Retorna os agendamentos de um cliente, do mais recente para o mais antigo.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    List<AppointmentResponseDTO> findByClient(UUID establishmentId, UUID clientId);
}
