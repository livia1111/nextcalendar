package com.nextcalendar.dto.order;

import com.nextcalendar.entity.PaymentMethod;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OrderUpdateDTO(

        @PositiveOrZero(message = "O desconto não pode ser negativo.")
        BigDecimal discountAmount,

        PaymentMethod paymentMethod
) {}
