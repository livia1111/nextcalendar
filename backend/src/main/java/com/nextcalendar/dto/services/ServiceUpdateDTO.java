package com.nextcalendar.dto.services;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServiceUpdateDTO(
        @NotBlank(message = "O nome do serviço é obrigatório.")
        @Size(min = 3,max = 120, message = "O nome deve ter entre 3 a 120 caracteres.")
        String name,

        @NotNull(message = "O preço do serviço é obrigatório.")
        @Positive(message = "O preço do serviço precisa ser positivo.")
        BigDecimal price,

        @NotNull(message = "A duração do serviço é obrigatória.")
        @Positive (message = "A duração deve ser maior que zero.")
        Integer duration,

        @NotBlank(message = "A categoria do serviço é obrigatória.")
        String category

        ) {}
