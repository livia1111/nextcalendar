package com.nextcalendar.dto.product;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductCreateDTO (
        @NotBlank(message = "O nome do produto é obrigatório.")
        @Size(min = 3, max = 120, message = "O nome deve ter entre 3 a 120 caracteres.")
        String name,

        @NotBlank(message = "A categoria é obrigatória.")
        @Size(max = 50, message = "A categoria deve possuir no máximo 50 caracteres.")
        String category,

        @NotNull(message = "O preço do produto é obrigatório.")
        @Positive(message = "O preço do produto precisa ser positivo.")
        BigDecimal price,

        @NotNull(message = "A quantidade em estoque é obrigatória.")
        @PositiveOrZero(message = "A quantidade em estoque não pode ser negativa.")
        Integer stockQuantity
){}
