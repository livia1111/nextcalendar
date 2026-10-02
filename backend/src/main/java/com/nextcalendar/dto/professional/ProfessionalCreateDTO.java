package com.nextcalendar.dto.professional;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

import java.math.BigDecimal;


public record ProfessionalCreateDTO(

    @NotBlank(message = "O nome do profissional é obrigatório")
    @Size(min = 3,max = 100,message = "O nome deve ter entre 3 a 100 caracteres.")
    String name,

    String nickname,

    String specialty,

    @NotBlank(message = "CPF é obrigatório para profissional.")
    @CPF(message = "CPF inválido.")
    String cpf,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "E-mail inválido")
    String email,

    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 8, max = 100, message = "A senha deve possuir pelo menos 8 caracteres.")
    String password,

    @NotBlank(message = "O telefone de contato é obrigatório.")
    String phone,

    String gender,

    String photoUrl,

    BigDecimal commission

    ) { }
