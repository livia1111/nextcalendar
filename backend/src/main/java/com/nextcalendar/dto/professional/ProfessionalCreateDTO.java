package com.nextcalendar.dto.professional;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

import java.math.BigDecimal;

/**
 * Payload para criação de profissional pelo gestor.
 * A senha NÃO é informada aqui — o backend gera uma senha temporária
 * automaticamente e a devolve somente na resposta de criação.
 */
public record ProfessionalCreateDTO(

    @NotBlank(message = "O nome do profissional é obrigatório")
    @Size(min = 3, max = 100, message = "O nome deve ter entre 3 a 100 caracteres.")
    String name,

    String nickname,

    String specialty,

    @NotBlank(message = "CPF é obrigatório para profissional.")
    @CPF(message = "CPF inválido.")
    String cpf,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "E-mail inválido")
    String email,

    @NotBlank(message = "O telefone de contato é obrigatório.")
    String phone,

    String gender,

    String photoUrl,

    BigDecimal commission

) {}
