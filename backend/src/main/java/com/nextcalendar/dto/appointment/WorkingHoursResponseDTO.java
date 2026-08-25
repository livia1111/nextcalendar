package com.nextcalendar.dto.appointment;

import com.nextcalendar.entity.WorkingHoursEntity;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

public record WorkingHoursResponseDTO(
        UUID id,
        UUID professionalId,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        LocalTime breakStart,
        LocalTime breakEnd,
        Boolean active
) {
    public WorkingHoursResponseDTO(WorkingHoursEntity entity) {
        this(
                entity.getId(),
                entity.getProfessional().getId(),
                entity.getDayOfWeek(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getBreakStart(),
                entity.getBreakEnd(),
                entity.getActive()
        );
    }
}
