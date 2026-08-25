package com.nextcalendar.dto.appointment;

import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentResponseDTO(
        UUID id,
        UUID professionalId,
        String professionalName,
        UUID serviceId,
        String serviceName,
        BigDecimal servicePrice,
        UUID clientId,
        String clientName,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        AppointmentStatus status,
        Boolean isFitIn,
        String notes
) {
    public AppointmentResponseDTO(AppointmentEntity ppointment) {
        this(
                ppointment.getId(),
                ppointment.getProfessional().getId(),
                ppointment.getProfessional().getName(),
                ppointment.getService().getId(),
                ppointment.getService().getName(),
                ppointment.getService().getPrice(),
                ppointment.getClient() != null ? ppointment.getClient().getId() : null,
                ppointment.getClient() != null ? ppointment.getClient().getName() : ppointment.getClientNameFallback(),
                ppointment.getStartDateTime(),
                ppointment.getEndDateTime(),
                ppointment.getStatus(),
                ppointment.isFitIn(),
                ppointment.getNotes()
        );
    }
}
