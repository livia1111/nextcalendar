package com.nextcalendar.dto.technicalsheet;

import com.nextcalendar.entity.TechnicalSheetEntryEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TechnicalSheetEntryResponseDTO(
        UUID id,
        UUID appointmentId,
        UUID professionalId,
        String professionalName,
        String serviceName,
        String notes,
        List<TechnicalSheetPhotoResponseDTO> photos,
        LocalDateTime createdAt
) {
    public TechnicalSheetEntryResponseDTO(TechnicalSheetEntryEntity entity) {
        this(
                entity.getId(),
                entity.getAppointment().getId(),
                entity.getProfessional().getId(),
                entity.getProfessional().getName(),
                entity.getAppointment().getService().getName(),
                entity.getNotes(),
                entity.getPhotos().stream().map(TechnicalSheetPhotoResponseDTO::new).toList(),
                entity.getCreatedAt()
        );
    }
}