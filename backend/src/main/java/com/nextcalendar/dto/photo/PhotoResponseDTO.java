package com.nextcalendar.dto.photo;

import com.nextcalendar.entity.PhotoEntity;
import com.nextcalendar.entity.PhotoType;

import java.time.LocalDateTime;
import java.util.UUID;

public record PhotoResponseDTO(
        UUID id,
        UUID appointmentId,
        UUID clientId,
        PhotoType type,
        String caption,
        UUID takenBy,
        String takenByName,
        String photoUrl,
        LocalDateTime createdAt
) {
    public PhotoResponseDTO(PhotoEntity photo) {
        this(
                photo.getId(),
                photo.getAppointment() != null ? photo.getAppointment().getId() : null,
                photo.getClient() != null ? photo.getClient().getId() : null,
                photo.getType(),
                photo.getCaption(),
                photo.getTakenBy() != null ? photo.getTakenBy().getId() : null,
                photo.getTakenBy() != null ? photo.getTakenBy().getName() : null,
                "/api/v1/photos/" + photo.getId(),
                photo.getCreatedAt()
        );
    }
}
