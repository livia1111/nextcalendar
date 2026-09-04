package com.nextcalendar.dto.order;

import com.nextcalendar.entity.OrderEntity;
import com.nextcalendar.entity.OrderStatus;
import com.nextcalendar.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponseDTO(
        UUID id,
        UUID appointmentId,
        UUID professionalId,
        String professionalName,
        String professionalPhotoUrl,
        String clientName,
        OrderStatus status,
        List<OrderItemResponseDTO> items,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        PaymentMethod paymentMethod,
        LocalDateTime createdAt,
        LocalDateTime closedAt
) {
    public OrderResponseDTO(OrderEntity entity) {
        this(
                entity.getId(),
                entity.getAppointment().getId(),
                entity.getAppointment().getProfessional().getId(),
                entity.getAppointment().getProfessional().getName(),
                entity.getAppointment().getProfessional().getPhotoUrl(),
                resolveClientName(entity),
                entity.getStatus(),
                entity.getItems().stream().map(OrderItemResponseDTO::new).toList(),
                calculateSubtotal(entity),
                entity.getDiscountAmount(),
                calculateTotal(entity),
                entity.getPaymentMethod(),
                entity.getCreatedAt(),
                entity.getClosedAt()
        );
    }

    private static String resolveClientName(OrderEntity entity) {
        if (entity.getAppointment().getClient() != null) {
            return entity.getAppointment().getClient().getName();
        }
        return entity.getAppointment().getClientNameFallback();
    }

    private static BigDecimal calculateSubtotal(OrderEntity entity) {
        return entity.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal calculateTotal(OrderEntity entity) {
        BigDecimal total = calculateSubtotal(entity).subtract(entity.getDiscountAmount());
        return total.max(BigDecimal.ZERO);
    }
}
