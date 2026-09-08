package com.nextcalendar.dto.technicalsheet;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Registra o "atendimento" (uma entrada na linha do tempo): quem atendeu e o
 * que foi feito é derivado do agendamento (appointmentId) — não precisa
 * mandar o profissional de novo.
 * photoUrls: já vêm prontas (o upload pro Firebase Storage acontece antes,
 * pelo app do profissional; aqui só guardamos os links).
 */
public record TechnicalSheetEntryCreateDTO(

        @NotNull(message = "O agendamento/atendimento é obrigatório.")
        UUID appointmentId,

        String notes,

        List<String> photoUrls
) {}