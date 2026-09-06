package com.nextcalendar.dto.product;

import com.nextcalendar.entity.ProductEntity;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductMinResponseDTO(
        UUID id,
        String name,
        String category,
        BigDecimal price,
        Integer stockQuantity
) {
    public ProductMinResponseDTO(ProductEntity entity) {
        this(entity.getId(), entity.getName(), entity.getCategory(), entity.getPrice(), entity.getStockQuantity());
    }
}
