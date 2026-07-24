package com.nextcalendar.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ClientCreateDTO(
        @NotBlank(message = "O nome do cliente é obrigatório")
        @Size(min = 3, max = 100, message = "O nome deve ter entre 3 a 100 caracteres.")
        String name,

        @NotBlank(message = "O telefone de contato é obrigatório")
        String phone,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "O formato do e-mail é inválido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, max = 100, message = "Senha deve possuir pelo menos 8 caracteres")
        String password,

        @Past(message = "A data de nascimento deve ser uma data no passado")
        LocalDate dateOfBirth,

        
        String photoUrl,
        String notes
        ){
}

