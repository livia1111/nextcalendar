package com.nextcalendar.dto.technicalsheet;

import com.nextcalendar.entity.TechnicalSheetPhotoEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record TechnicalSheetPhotoResponseDTO(
        UUID id,
        String photoUrl,
        LocalDateTime createdAt
) {
    public TechnicalSheetPhotoResponseDTO(TechnicalSheetPhotoEntity entity) {
        this(entity.getId(), entity.getPhotoUrl(), entity.getCreatedAt());
    }
}