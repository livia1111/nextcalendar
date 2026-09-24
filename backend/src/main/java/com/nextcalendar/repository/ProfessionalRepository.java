package com.nextcalendar.repository;

import com.nextcalendar.entity.ProfessionalEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfessionalRepository extends JpaRepository<ProfessionalEntity, UUID> {

    Optional<ProfessionalEntity> findByIdAndEstablishmentId(UUID id, UUID establishmentId);

    Optional<ProfessionalEntity> findByUser_Id(UUID userId);

    Page<ProfessionalEntity> findByEstablishmentId(UUID establishmentId, Pageable pageable);

    Page<ProfessionalEntity> findByEstablishmentIdAndActiveTrue(UUID establishmentId, Pageable pageable);

    Page<ProfessionalEntity> findByEstablishmentIdAndNameContainingIgnoreCase(UUID establishmentId, String name, Pageable pageable);

    boolean existsByCpf(String cpf);
    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);
    boolean existsByCpfAndIdNot(String cpf, UUID id);
}
