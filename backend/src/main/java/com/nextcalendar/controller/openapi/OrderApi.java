package com.nextcalendar.controller.openapi;

import com.nextcalendar.dto.order.OrderItemAddDTO;
import com.nextcalendar.dto.order.OrderResponseDTO;
import com.nextcalendar.dto.order.OrderUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.UUID;

@Tag(name = "Comandas", description = "Endpoints para gerenciamento da comanda de um agendamento (serviços, produtos, desconto, pagamento e fechamento)")
public interface OrderApi {

    @Operation(summary = "Abrir (ou recuperar) a comanda de um agendamento",
            description = "Cria a comanda de um agendamento, pré-populada com o serviço agendado. Se a comanda já existir, apenas a retorna (idempotente).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Comanda aberta/recuperada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Agendamento ou estabelecimento não encontrado")
    })
    OrderResponseDTO openOrder(UUID establishmentId, UUID appointmentId);

    @Operation(summary = "Buscar comanda", description = "Retorna os detalhes de uma comanda, incluindo os itens já adicionados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Comanda encontrada"),
            @ApiResponse(responseCode = "404", description = "Comanda não encontrada")
    })
    OrderResponseDTO findById(UUID establishmentId, UUID orderId);

    @Operation(summary = "Adicionar item à comanda", description = "Adiciona um serviço ou produto à comanda antes do fechamento.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item adicionado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Comanda já finalizada"),
            @ApiResponse(responseCode = "404", description = "Comanda, serviço ou produto não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    OrderResponseDTO addItem(UUID establishmentId, UUID orderId, OrderItemAddDTO dto);

    @Operation(summary = "Remover item da comanda", description = "Remove um serviço ou produto previamente adicionado à comanda.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item removido com sucesso"),
            @ApiResponse(responseCode = "400", description = "Comanda já finalizada"),
            @ApiResponse(responseCode = "404", description = "Comanda ou item não encontrado")
    })
    OrderResponseDTO removeItem(UUID establishmentId, UUID orderId, UUID itemId);

    @Operation(summary = "Atualizar desconto / forma de pagamento", description = "Atualiza o desconto aplicado e/ou a forma de pagamento da comanda (PATCH parcial).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Comanda atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Comanda já finalizada"),
            @ApiResponse(responseCode = "404", description = "Comanda não encontrada")
    })
    OrderResponseDTO update(UUID establishmentId, UUID orderId, OrderUpdateDTO dto);

    @Operation(summary = "Finalizar comanda", description = "Fecha a comanda — exige ao menos um item e forma de pagamento definida. Marca o agendamento de origem como concluído.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Comanda finalizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Faltam itens ou forma de pagamento"),
            @ApiResponse(responseCode = "404", description = "Comanda não encontrada")
    })
    OrderResponseDTO finish(UUID establishmentId, UUID orderId);
}
