package com.nextcalendar.dto.appointment;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentCreateDTO(

        @NotNull(message = "O profissional é obrigatório")
        UUID professionalId,

        @NotNull(message = "O serviço é obrigatório")
        UUID serviceId,

        UUID clientId,

        String clientNameFallback,
        String clientPhoneFallback,

        @NotNull(message = "A data e horário do agendamento são obrigatórios")
        LocalDateTime startDateTime,

        Boolean isFitIn,

        String notes
) { }
