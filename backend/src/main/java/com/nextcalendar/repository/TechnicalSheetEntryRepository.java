package com.nextcalendar.repository;

import com.nextcalendar.entity.TechnicalSheetEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TechnicalSheetEntryRepository extends JpaRepository<TechnicalSheetEntryEntity, UUID> {

    boolean existsByAppointmentId(UUID appointmentId);

    Optional<TechnicalSheetEntryEntity> findByAppointmentId(UUID appointmentId);
}
