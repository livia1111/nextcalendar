package com.nextcalendar.dto.order;

import com.nextcalendar.entity.OrderItemType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record OrderItemAddDTO(

        @NotNull(message = "O tipo do item é obrigatório (SERVICE ou PRODUCT).")
        OrderItemType itemType,

        @NotNull(message = "O id do serviço/produto é obrigatório.")
        UUID itemId,

        @Positive(message = "A quantidade deve ser maior que zero.")
        Integer quantity
) {}
