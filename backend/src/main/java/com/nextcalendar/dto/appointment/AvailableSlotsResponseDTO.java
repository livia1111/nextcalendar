package com.nextcalendar.dto.appointment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AvailableSlotsResponseDTO(
        UUID serviceId,
        String serviceName,
        BigDecimal price,
        Integer durationMinutes,
        LocalDate date,
        List<LocalTime> slots
) {
}
