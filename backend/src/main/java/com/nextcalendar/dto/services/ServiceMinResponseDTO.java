package com.nextcalendar.dto.services;

import com.nextcalendar.entity.ServiceEntity;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceMinResponseDTO(
        UUID id,
        String name,
        BigDecimal price,
        Integer duration,
        String category
) {
    public ServiceMinResponseDTO(ServiceEntity entity) {
        this(entity.getId(),entity.getName(),entity.getPrice(),entity.getDuration(),entity.getCategory());
    }
}
