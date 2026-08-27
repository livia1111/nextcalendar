package com.nextcalendar.mapper;

import com.nextcalendar.dto.appointment.BlockedTimeCreateDTO;
import com.nextcalendar.dto.appointment.BlockedTimeResponseDTO;
import com.nextcalendar.entity.BlockedTimeEntity;
import com.nextcalendar.entity.ProfessionalEntity;
import org.springframework.stereotype.Component;

@Component
public class BlockedTimeMapper {

    public BlockedTimeEntity toEntity(BlockedTimeCreateDTO dto, ProfessionalEntity professional) {
        BlockedTimeEntity entity = new BlockedTimeEntity();

        entity.setProfessional(professional);
        entity.setStartDateTime(dto.startDateTime());
        entity.setEndDateTime(dto.endDateTime());
        entity.setReason(dto.reason());

        return entity;
    }

    public BlockedTimeResponseDTO toResponseDTO(BlockedTimeEntity entity) {
        return new BlockedTimeResponseDTO(
                entity.getId(),
                entity.getProfessional().getId(),
                entity.getStartDateTime(),
                entity.getEndDateTime(),
                entity.getReason()
        );
    }
}
