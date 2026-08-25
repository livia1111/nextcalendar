package com.nextcalendar.dto.appointment;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WorkingHoursUpdateDTO(
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        LocalTime breakStart,
        LocalTime breakEnd,
        Boolean active
) { }
