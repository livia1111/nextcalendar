package com.nextcalendar.controller.openapi;

import com.nextcalendar.dto.technicalsheet.TechnicalSheetEntryCreateDTO;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetResponseDTO;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.UUID;

@Tag(name = "Ficha Técnica", description = "Histórico técnico do cliente: observações gerais, fotos e anotações por atendimento")
public interface TechnicalSheetApi {

    @Operation(summary = "Buscar a ficha técnica do cliente",
            description = "Retorna as observações gerais e a linha do tempo de atendimentos (com fotos). Se o cliente ainda não tiver uma ficha, cria uma vazia na hora.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ficha técnica retornada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado")
    })
    TechnicalSheetResponseDTO findByClient(UUID clientId);

    @Operation(summary = "Atualizar observações gerais",
            description = "Atualiza as anotações gerais do cliente (preferências, restrições/alergias), que não são ligadas a nenhum atendimento específico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Observações atualizadas com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado")
    })
    TechnicalSheetResponseDTO updateObservations(UUID clientId, TechnicalSheetUpdateDTO dto);

    @Operation(summary = "Adicionar atendimento à linha do tempo",
            description = "Registra um novo atendimento na ficha técnica do cliente, com fotos e anotações daquele dia. O profissional e o serviço são obtidos a partir do agendamento informado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Atendimento registrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "O agendamento não pertence a este cliente"),
            @ApiResponse(responseCode = "404", description = "Cliente ou agendamento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    TechnicalSheetResponseDTO addEntry(UUID clientId, TechnicalSheetEntryCreateDTO dto);

    @Operation(summary = "Remover atendimento da linha do tempo", description = "Remove um registro (fotos + anotações) previamente adicionado à ficha técnica.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registro removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Ficha técnica ou registro não encontrado")
    })
    TechnicalSheetResponseDTO removeEntry(UUID clientId, UUID entryId);
}