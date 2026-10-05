package com.nextcalendar.repository;

import com.nextcalendar.entity.PhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<PhotoEntity, UUID> {

    List<PhotoEntity> findByAppointmentIdOrderByCreatedAtAsc(UUID appointmentId);

    List<PhotoEntity> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    @Query("""
            SELECT p FROM PhotoEntity p
            WHERE p.client.id = :clientId
              AND p.appointment.professional.id = :professionalId
            ORDER BY p.createdAt DESC
            """)
    List<PhotoEntity> findByClientIdAndProfessionalId(
            @Param("clientId") UUID clientId,
            @Param("professionalId") UUID professionalId
    );

    @Query("""
            SELECT p FROM PhotoEntity p
            WHERE p.client.id = :clientId
              AND p.appointment.establishment.id = :establishmentId
            ORDER BY p.createdAt DESC
            """)
    List<PhotoEntity> findByClientIdAndEstablishmentId(
            @Param("clientId") UUID clientId,
            @Param("establishmentId") UUID establishmentId
    );

    long countByAppointmentId(UUID appointmentId);
}
