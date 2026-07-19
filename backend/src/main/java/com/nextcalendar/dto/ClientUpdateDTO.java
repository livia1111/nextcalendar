package com.nextcalendar.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record ClientUpdateDTO(

        @Size(min = 3, max = 100, message = "O nome deve ter entre 3 a 100 caracteres.")
        String name,

        String phone,

        @Email(message = "O formato do e-mail é inválido")
        String email,

        String photoUrl,
        String notes) {
}
