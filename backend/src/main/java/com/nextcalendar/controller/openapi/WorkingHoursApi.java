package com.nextcalendar.controller.openapi;

import com.nextcalendar.dto.appointment.WorkingHoursCreateDTO;
import com.nextcalendar.dto.appointment.WorkingHoursResponseDTO;
import com.nextcalendar.dto.appointment.WorkingHoursUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Tag(name = "Jornada de Trabalho", description = "Endpoints para gerenciamento do horário de expediente dos profissionais")
public interface WorkingHoursApi {

    @Operation(summary = "Cadastrar jornada de trabalho", description = "Cadastra o horário de expediente do profissional para um dia da semana, incluindo intervalo de almoço opcional.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Jornada cadastrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Já existe jornada cadastrada para este dia, ou horário de início posterior ao término"),
            @ApiResponse(responseCode = "404", description = "Profissional ou estabelecimento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    WorkingHoursResponseDTO create(UUID establishmentId, UUID professionalId, WorkingHoursCreateDTO dto);

    @Operation(summary = "Atualizar jornada de trabalho", description = "Atualiza parcialmente uma jornada de trabalho existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Jornada atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Já existe jornada cadastrada para o novo dia informado"),
            @ApiResponse(responseCode = "404", description = "Jornada, profissional ou estabelecimento não encontrado")
    })
    WorkingHoursResponseDTO update(UUID establishmentId, UUID professionalId, UUID id, WorkingHoursUpdateDTO dto);

    @Operation(summary = "Listar jornadas do profissional", description = "Retorna todas as jornadas de trabalho cadastradas para o profissional, uma por dia da semana.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    List<WorkingHoursResponseDTO> findByProfessional(UUID establishmentId, UUID professionalId);

    @Operation(summary = "Remover jornada de trabalho", description = "Exclui uma jornada de trabalho cadastrada.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Jornada removida com sucesso"),
            @ApiResponse(responseCode = "404", description = "Jornada não encontrada")
    })
    void delete(UUID id);
}
