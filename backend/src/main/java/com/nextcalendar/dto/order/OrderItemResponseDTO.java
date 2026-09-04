package com.nextcalendar.dto.order;

import com.nextcalendar.entity.OrderItemEntity;
import com.nextcalendar.entity.OrderItemType;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponseDTO(
        UUID id,
        OrderItemType itemType,
        String name,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal subtotal
) {
    public OrderItemResponseDTO(OrderItemEntity entity) {
        this(
                entity.getId(),
                entity.getItemType(),
                entity.getName(),
                entity.getUnitPrice(),
                entity.getQuantity(),
                entity.getUnitPrice().multiply(BigDecimal.valueOf(entity.getQuantity()))
        );
    }
}
