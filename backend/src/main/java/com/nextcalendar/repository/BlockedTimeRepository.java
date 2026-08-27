package com.nextcalendar.repository;

import com.nextcalendar.entity.BlockedTimeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BlockedTimeRepository extends JpaRepository<BlockedTimeEntity, UUID> {

    List<BlockedTimeEntity> findByProfessionalIdAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
            UUID professionalId, LocalDateTime endDateTime, LocalDateTime startDateTime);

    List<BlockedTimeEntity> findByProfessionalIdOrderByStartDateTimeAsc(UUID professionalId);
}
