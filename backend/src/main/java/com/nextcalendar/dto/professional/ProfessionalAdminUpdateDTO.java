package com.nextcalendar.dto.professional;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

import java.math.BigDecimal;

public record ProfessionalAdminUpdateDTO(
        @Size(min = 3,max = 100,message = "O nome deve ter entre 3 a 100 caracteres.")
        String name,

        String nickname,

        String specialty,

        @CPF(message = "CPF inválido.")
        String cpf,

        @Email(message = "E-mail inválido")
        String email,

        String phone,

        String photoUrl,

        BigDecimal commission,

        Boolean active
) { }
