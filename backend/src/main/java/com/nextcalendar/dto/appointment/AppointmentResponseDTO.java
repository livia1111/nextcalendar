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
) { }
