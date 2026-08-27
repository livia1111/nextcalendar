package com.nextcalendar.controller.openapi;

import com.nextcalendar.dto.appointment.BlockedTimeCreateDTO;
import com.nextcalendar.dto.appointment.BlockedTimeResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Tag(name = "Bloqueios de Horário", description = "Endpoints para gerenciamento de bloqueios manuais na agenda do profissional")
public interface BlockedTimeApi {

    @Operation(summary = "Cadastrar bloqueio de horário", description = "Bloqueia um intervalo de horário na agenda do profissional (folga, imprevisto, etc). Valida conflito com agendamentos existentes e com outros bloqueios já cadastrados.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Bloqueio cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Conflito com agendamento existente, com outro bloqueio, ou horário de início posterior ao término"),
            @ApiResponse(responseCode = "404", description = "Profissional ou estabelecimento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    BlockedTimeResponseDTO create(UUID establishmentId, UUID professionalId, BlockedTimeCreateDTO dto);

    @Operation(summary = "Listar bloqueios do profissional", description = "Retorna todos os bloqueios de horário cadastrados para o profissional, em ordem cronológica.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Profissional ou estabelecimento não encontrado")
    })
    List<BlockedTimeResponseDTO> findByProfessional(UUID establishmentId, UUID professionalId);

    @Operation(summary = "Remover bloqueio de horário", description = "Exclui um bloqueio de horário, liberando o intervalo na agenda do profissional.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Bloqueio removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Bloqueio não encontrado")
    })
    void delete(UUID id);
}
