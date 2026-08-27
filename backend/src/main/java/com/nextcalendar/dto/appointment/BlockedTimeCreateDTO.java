package com.nextcalendar.dto.appointment;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record BlockedTimeCreateDTO(

        @NotNull(message = "O horário de início é obrigatório")
        LocalDateTime startDateTime,

        @NotNull(message = "O horário de término é obrigatório")
        LocalDateTime endDateTime,

        String reason
) { }
