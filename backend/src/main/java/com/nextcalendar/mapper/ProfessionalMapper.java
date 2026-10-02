package com.nextcalendar.mapper;

import com.nextcalendar.dto.professional.ProfessionalAdminUpdateDTO;
import com.nextcalendar.dto.professional.ProfessionalCreateDTO;
import com.nextcalendar.dto.professional.ProfessionalSelfUpdateDTO;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProfessionalEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class ProfessionalMapper {

    private final PasswordEncoder passwordEncoder;

    public ProfessionalMapper(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public ProfessionalEntity toEntity(ProfessionalCreateDTO dto, EstablishmentEntity establishment) {
        ProfessionalEntity professional = new ProfessionalEntity();

        professional.setEstablishment(establishment);
        professional.setName(dto.name());
        professional.setNickname(dto.nickname());
        professional.setSpecialty(dto.specialty());
        professional.setCpf(dto.cpf());
        professional.setEmail(dto.email());
        professional.setPassword(passwordEncoder.encode(dto.password()));
        professional.setPhone(dto.phone());
        professional.setGender(dto.gender());
        professional.setPhotoUrl(dto.photoUrl());
        professional.setCommission(dto.commission());
        professional.setActive(true);

        return professional;
    }

    public void updateEntityFromAdmin(ProfessionalEntity professional, ProfessionalAdminUpdateDTO dto) {
        if (dto.name() != null && !dto.name().isBlank()) {
            professional.setName(dto.name());
        }
        if (dto.nickname() != null) {
            professional.setNickname(dto.nickname());
        }
        if (dto.specialty() != null) {
            professional.setSpecialty(dto.specialty());
        }
        if (dto.cpf() != null && !dto.cpf().isBlank()) {
            professional.setCpf(dto.cpf());
        }
        if (dto.email() != null && !dto.email().isBlank()) {
            professional.setEmail(dto.email());
        }
        if (dto.phone() != null && !dto.phone().isBlank()) {
            professional.setPhone(dto.phone());
        }
        if (dto.photoUrl() != null) {
            professional.setPhotoUrl(dto.photoUrl());
        }
        if (dto.commission() != null) {
            professional.setCommission(dto.commission());
        }
        if (dto.active() != null) {
            professional.setActive(dto.active());
        }
    }

    public void updateEntityFromSelf(ProfessionalEntity professional, ProfessionalSelfUpdateDTO dto) {
        if (dto.name() != null && !dto.name().isBlank()) {
            professional.setName(dto.name());
        }
        if (dto.nickname() != null) {
            professional.setNickname(dto.nickname());
        }
        if (dto.email() != null && !dto.email().isBlank()) {
            professional.setEmail(dto.email());
        }
        if (dto.phone() != null && !dto.phone().isBlank()) {
            professional.setPhone(dto.phone());
        }
        if (dto.photoUrl() != null) {
            professional.setPhotoUrl(dto.photoUrl());
        }
    }
}
