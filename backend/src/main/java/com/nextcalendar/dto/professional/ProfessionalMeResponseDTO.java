package com.nextcalendar.dto.professional;

import com.nextcalendar.entity.ProfessionalEntity;

import java.math.BigDecimal;
import java.util.UUID;

public record ProfessionalMeResponseDTO(
        UUID id,
        UUID establishmentId,
        String name,
        String nickname,
        String email,
        String phone,
        String photoUrl,
        BigDecimal commission,
        Boolean active
) {
    public ProfessionalMeResponseDTO(ProfessionalEntity professional) {
        this(
                professional.getId(),
                professional.getEstablishment().getId(),
                professional.getName(),
                professional.getNickname(),
                professional.getEmail(),
                professional.getPhone(),
                professional.getPhotoUrl(),
                professional.getCommission(),
                professional.getActive()
        );
    }
}