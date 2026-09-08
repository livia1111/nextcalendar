package com.nextcalendar.dto.technicalsheet;

/**
 * Atualiza só as anotações gerais (preferências, restrições/alergias, etc),
 * que não são ligadas a um atendimento específico.
 */
public record TechnicalSheetUpdateDTO(
        String observations
) {}