package com.nextcalendar.dto.professional;

import com.nextcalendar.entity.ProfessionalEntity;

import java.math.BigDecimal;
import java.util.UUID;

public record ProfessionalMeResponseDTO(
        UUID id,
        String name,
        String nickname,
        String cpf,
        String email,
        String phone,
        String gender,
        String photoUrl,
        BigDecimal commission,
        Boolean active,
        UUID establishmentId,
        String establishmentName
) {
    public ProfessionalMeResponseDTO(ProfessionalEntity entity) {
        this(
                entity.getId(),
                entity.getName(),
                entity.getNickname(),
                entity.getCpf(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getGender(),
                entity.getPhotoUrl(),
                entity.getCommission(),
                entity.getActive(),
                entity.getEstablishment() != null ? entity.getEstablishment().getId() : null,
                entity.getEstablishment() != null ? entity.getEstablishment().getName() : null
        );
    }
}
