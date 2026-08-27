package com.nextcalendar.dto.appointment;

import com.nextcalendar.entity.BlockedTimeEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record BlockedTimeResponseDTO(
        UUID id,
        UUID professionalId,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        String reason
) { }
