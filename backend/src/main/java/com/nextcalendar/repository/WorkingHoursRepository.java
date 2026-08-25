package com.nextcalendar.repository;

import com.nextcalendar.entity.WorkingHoursEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkingHoursRepository extends JpaRepository<WorkingHoursEntity, UUID> {

    Optional<WorkingHoursEntity> findByProfessionalIdAndDayOfWeekAndActiveTrue(UUID professionalId, DayOfWeek dayOfWeek);

    List<WorkingHoursEntity> findByProfessionalId(UUID professionalId);

    boolean existsByProfessionalIdAndDayOfWeek(UUID professionalId, DayOfWeek dayOfWeek);
}
