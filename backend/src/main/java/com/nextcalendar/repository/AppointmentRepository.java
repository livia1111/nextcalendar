package com.nextcalendar.repository;

import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.AppointmentStatus;
import jakarta.persistence.LockModeType;
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

    List<AppointmentEntity> findByProfessionalIdAndStartDateTimeBetween(
            UUID professionalId, LocalDateTime start, LocalDateTime end);

    List<AppointmentEntity> findByClientIdOrderByStartDateTimeDesc(UUID clientId);
}
