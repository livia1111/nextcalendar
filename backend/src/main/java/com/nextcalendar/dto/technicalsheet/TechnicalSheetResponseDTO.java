package com.nextcalendar.dto.technicalsheet;

import com.nextcalendar.entity.TechnicalSheetEntity;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record TechnicalSheetResponseDTO(
        UUID id,
        UUID clientId,
        String clientName,
        String observations,
        List<TechnicalSheetEntryResponseDTO> entries,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public TechnicalSheetResponseDTO(TechnicalSheetEntity entity) {
        this(
                entity.getId(),
                entity.getClient().getId(),
                entity.getClient().getName(),
                entity.getObservations(),
                // Mais recente primeiro — assim o app mostra o último atendimento no topo
                entity.getEntries().stream()
                        .sorted(Comparator.comparing(com.nextcalendar.entity.TechnicalSheetEntryEntity::getCreatedAt).reversed())
                        .map(TechnicalSheetEntryResponseDTO::new)
                        .toList(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
