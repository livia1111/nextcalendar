package com.nextcalendar.repository;

import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.professional.id = :professionalId
              AND a.status <> :excludedStatus
              AND a.startDateTime < :endDateTime
              AND a.endDateTime > :startDateTime
            """)
    List<AppointmentEntity> findOverlapping(
            @Param("professionalId") UUID professionalId,
            @Param("excludedStatus") AppointmentStatus excludedStatus,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT a FROM AppointmentEntity a
        WHERE a.professional.id = :professionalId
          AND a.id <> :excludeAppointmentId
          AND a.status <> :excludedStatus
          AND a.startDateTime < :endDateTime
          AND a.endDateTime > :startDateTime
        """)
    List<AppointmentEntity> findOverlappingExcludingSelf(
            @Param("professionalId") UUID professionalId,
            @Param("excludeAppointmentId") UUID excludeAppointmentId,
            @Param("excludedStatus") AppointmentStatus excludedStatus,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.professional.establishment.id = :establishmentId
              AND (:professionalId IS NULL OR a.professional.id = :professionalId)
              AND a.startDateTime >= :startDateTime
              AND a.startDateTime < :endDateTime
            ORDER BY a.startDateTime ASC
            """)
    List<AppointmentEntity> findByEstablishmentAndDate(
            @Param("establishmentId") UUID establishmentId,
            @Param("professionalId") UUID professionalId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    List<AppointmentEntity> findByProfessionalIdAndStartDateTimeBetween(
            UUID professionalId, LocalDateTime start, LocalDateTime end);

    List<AppointmentEntity> findByProfessionalIdAndStartDateTimeBetweenOrderByStartDateTimeAsc(
            UUID professionalId, LocalDateTime start, LocalDateTime end);

    List<AppointmentEntity> findByClientIdOrderByStartDateTimeDesc(UUID clientId);

    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.professional.id = :professionalId
              AND ((:status IS NOT NULL AND a.status = :status) OR (:status IS NULL AND a.status IN (com.nextcalendar.entity.AppointmentStatus.IN_PROGRESS, com.nextcalendar.entity.AppointmentStatus.DONE)))
              AND (:clientId IS NULL OR (a.client IS NOT NULL AND a.client.id = :clientId))
              AND (:from IS NULL OR a.startDateTime >= :from)
              AND (:to IS NULL OR a.startDateTime <= :to)
            ORDER BY a.startDateTime DESC
            """)
    Page<AppointmentEntity> findAttendancesByProfessional(
            @Param("professionalId") UUID professionalId,
            @Param("status") AppointmentStatus status,
            @Param("clientId") UUID clientId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.establishment.id = :establishmentId
              AND (:professionalId IS NULL OR a.professional.id = :professionalId)
              AND ((:status IS NOT NULL AND a.status = :status) OR (:status IS NULL AND a.status IN (com.nextcalendar.entity.AppointmentStatus.IN_PROGRESS, com.nextcalendar.entity.AppointmentStatus.DONE)))
              AND (:clientId IS NULL OR (a.client IS NOT NULL AND a.client.id = :clientId))
              AND (:from IS NULL OR a.startDateTime >= :from)
              AND (:to IS NULL OR a.startDateTime <= :to)
            ORDER BY a.startDateTime DESC
            """)
    Page<AppointmentEntity> findAttendancesByEstablishment(
            @Param("establishmentId") UUID establishmentId,
            @Param("professionalId") UUID professionalId,
            @Param("status") AppointmentStatus status,
            @Param("clientId") UUID clientId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.client.id = :clientId
              AND a.professional.id = :professionalId
              AND a.status IN (com.nextcalendar.entity.AppointmentStatus.IN_PROGRESS, com.nextcalendar.entity.AppointmentStatus.DONE)
            ORDER BY a.startDateTime DESC
            """)
    List<AppointmentEntity> findAttendancesByClientAndProfessional(
            @Param("clientId") UUID clientId,
            @Param("professionalId") UUID professionalId
    );

    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.client.id = :clientId
              AND a.establishment.id = :establishmentId
              AND a.status IN (com.nextcalendar.entity.AppointmentStatus.IN_PROGRESS, com.nextcalendar.entity.AppointmentStatus.DONE)
            ORDER BY a.startDateTime DESC
            """)
    List<AppointmentEntity> findAttendancesByClientAndEstablishment(
            @Param("clientId") UUID clientId,
            @Param("establishmentId") UUID establishmentId
    );
}
