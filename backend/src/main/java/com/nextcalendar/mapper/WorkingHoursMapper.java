package com.nextcalendar.mapper;

import com.nextcalendar.dto.appointment.WorkingHoursCreateDTO;
import com.nextcalendar.dto.appointment.WorkingHoursUpdateDTO;
import com.nextcalendar.entity.ProfessionalEntity;
import com.nextcalendar.entity.WorkingHoursEntity;
import org.springframework.stereotype.Component;

@Component
public class WorkingHoursMapper {

    public WorkingHoursEntity toEntity(WorkingHoursCreateDTO dto, ProfessionalEntity professional) {
        WorkingHoursEntity entity = new WorkingHoursEntity();

        entity.setProfessional(professional);
        entity.setDayOfWeek(dto.dayOfWeek());
        entity.setStartTime(dto.startTime());
        entity.setEndTime(dto.endTime());
        entity.setBreakStart(dto.breakStart());
        entity.setBreakEnd(dto.breakEnd());
        entity.setActive(true);

        return entity;
    }

    public void updateEntity(WorkingHoursEntity entity, WorkingHoursUpdateDTO dto) {
        if (dto.dayOfWeek() != null){
            entity.setDayOfWeek(dto.dayOfWeek());
        }

        if (dto.startTime() != null){
            entity.setStartTime(dto.startTime());
        }

        if (dto.endTime() != null){
            entity.setEndTime(dto.endTime());
        }

        if (dto.breakStart() != null){
            entity.setBreakStart(dto.breakStart());
        }

        if (dto.breakEnd() != null){
            entity.setBreakEnd(dto.breakEnd());
        }

        if (dto.active() != null){
            entity.setActive(dto.active());
        }
    }
}
