package com.nextcalendar.dto.professional;

import com.nextcalendar.entity.ProfessionalEntity;

import java.math.BigDecimal;

/**
 * DTO de resposta do perfil do profissional.
 *
 * O campo {@code temporaryPassword} é preenchido SOMENTE na resposta de criação
 * (POST /professionals) com a senha temporária em texto puro para que o gestor
 * possa repassá-la ao profissional. Em todas as outras operações (GET, PUT) ele
 * virá {@code null} e nunca será persistido nem logado.
 */
public record ProfessionalProfileResponseDTO(
        String name,
        String nickname,
        String cpf,
        String email,
        String phone,
        String gender,
        String photoUrl,
        BigDecimal commission,
        /** Senha temporária em texto puro — presente SOMENTE na criação. */
        String temporaryPassword) {

    /** Construtor para leitura (GET, PUT) — temporaryPassword = null. */
    public ProfessionalProfileResponseDTO(ProfessionalEntity professional) {
        this(
                professional.getName(),
                professional.getNickname(),
                professional.getCpf(),
                professional.getEmail(),
                professional.getPhone(),
                professional.getGender(),
                professional.getPhotoUrl(),
                professional.getCommission(),
                null
        );
    }
}
