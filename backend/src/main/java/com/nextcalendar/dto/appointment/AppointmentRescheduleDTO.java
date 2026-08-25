package com.nextcalendar.dto.appointment;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentRescheduleDTO(
        @NotNull(message = "O novo horário é obrigatório")
        LocalDateTime newStartDateTime)
{ }
