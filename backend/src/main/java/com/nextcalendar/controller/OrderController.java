package com.nextcalendar.controller;

import com.nextcalendar.controller.openapi.OrderApi;
import com.nextcalendar.dto.order.OrderItemAddDTO;
import com.nextcalendar.dto.order.OrderResponseDTO;
import com.nextcalendar.dto.order.OrderUpdateDTO;
import com.nextcalendar.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/establishments/{establishmentId}")

public class OrderController implements OrderApi {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // ── Abrir/recuperar a comanda de um agendamento ──
    @Override
    @PostMapping("/appointments/{appointmentId}/order")
    public OrderResponseDTO openOrder(@PathVariable UUID establishmentId, @PathVariable UUID appointmentId) {
        return orderService.openOrder(establishmentId, appointmentId);
    }

    @Override
    @GetMapping("/orders/{orderId}")
    public OrderResponseDTO findById(@PathVariable UUID establishmentId, @PathVariable UUID orderId) {
        return orderService.findById(establishmentId, orderId);
    }

    @Override
    @PostMapping("/orders/{orderId}/items")
    public OrderResponseDTO addItem(@PathVariable UUID establishmentId, @PathVariable UUID orderId, @Valid @RequestBody OrderItemAddDTO dto) {
        return orderService.addItem(establishmentId, orderId, dto);
    }

    @Override
    @DeleteMapping("/orders/{orderId}/items/{itemId}")
    public OrderResponseDTO removeItem(@PathVariable UUID establishmentId, @PathVariable UUID orderId, @PathVariable UUID itemId) {
        return orderService.removeItem(establishmentId, orderId, itemId);
    }

    @Override
    @PatchMapping("/orders/{orderId}")
    public OrderResponseDTO update(@PathVariable UUID establishmentId, @PathVariable UUID orderId, @Valid @RequestBody OrderUpdateDTO dto) {
        return orderService.update(establishmentId, orderId, dto);
    }

    @Override
    @PostMapping("/orders/{orderId}/finish")
    public OrderResponseDTO finish(@PathVariable UUID establishmentId, @PathVariable UUID orderId) {
        return orderService.finish(establishmentId, orderId);
    }
}