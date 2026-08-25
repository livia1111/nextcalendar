package com.nextcalendar.dto.appointment;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WorkingHoursCreateDTO(
        @NotNull
        DayOfWeek dayOfWeek,

        @NotNull
        LocalTime startTime,

        @NotNull
        LocalTime endTime,

        LocalTime breakStart,
        LocalTime breakEnd
) {
}
