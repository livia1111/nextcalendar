package com.nextcalendar.service;


import com.nextcalendar.dto.appointment.WorkingHoursCreateDTO;
import com.nextcalendar.dto.appointment.WorkingHoursResponseDTO;
import com.nextcalendar.dto.appointment.WorkingHoursUpdateDTO;
import com.nextcalendar.entity.ProfessionalEntity;
import com.nextcalendar.entity.WorkingHoursEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.WorkingHoursMapper;
import com.nextcalendar.repository.ProfessionalRepository;
import com.nextcalendar.repository.WorkingHoursRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class WorkingHoursService {
    private final WorkingHoursRepository workingHoursRepository;
    private final ProfessionalRepository professionalRepository;
    private final WorkingHoursMapper workingHoursMapper;

    public WorkingHoursService(WorkingHoursRepository workingHoursRepository,
                               ProfessionalRepository professionalRepository,
                               WorkingHoursMapper workingHoursMapper) {
        this.workingHoursRepository = workingHoursRepository;
        this.professionalRepository = professionalRepository;
        this.workingHoursMapper = workingHoursMapper;
    }

    private ProfessionalEntity findProfessional(UUID establishmentId, UUID professionalId) {
        return professionalRepository.findByIdAndEstablishmentId(professionalId, establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Profissional", professionalId));
    }

    private WorkingHoursEntity findWorkingHours(UUID id) {
        return workingHoursRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Horário de trabalho", id));
    }

    @Transactional
    public WorkingHoursResponseDTO create(UUID establishmentId, UUID professionalId, WorkingHoursCreateDTO dto) {

        ProfessionalEntity professional = findProfessional(establishmentId, professionalId);

        if (workingHoursRepository.existsByProfessionalIdAndDayOfWeek(professionalId, dto.dayOfWeek())) {
            throw new BusinessException(
                    "Já existe um horário de trabalho cadastrado para " + dto.dayOfWeek() + " para este profissional.");
        }

        if (!dto.startTime().isBefore(dto.endTime())) {
            throw new BusinessException("O horário de início deve ser anterior ao horário de término.");
        }

        WorkingHoursEntity entity = workingHoursMapper.toEntity(dto, professional);
        WorkingHoursEntity saved = workingHoursRepository.save(entity);

        return new WorkingHoursResponseDTO(saved);
    }

    @Transactional
    public WorkingHoursResponseDTO update(UUID establishmentId, UUID professionalId, UUID id, WorkingHoursUpdateDTO dto) {

        findProfessional(establishmentId, professionalId);
        WorkingHoursEntity entity = findWorkingHours(id);

        if (dto.dayOfWeek() != null && !dto.dayOfWeek().equals(entity.getDayOfWeek())
                && workingHoursRepository.existsByProfessionalIdAndDayOfWeek(professionalId, dto.dayOfWeek())) {
            throw new BusinessException(
                    "Já existe um horário de trabalho cadastrado para " + dto.dayOfWeek() + " para este profissional.");
        }

        workingHoursMapper.updateEntity(entity, dto);

        WorkingHoursEntity updated = workingHoursRepository.save(entity);
        return new WorkingHoursResponseDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<WorkingHoursResponseDTO> findByProfessional(UUID establishmentId, UUID professionalId) {
        findProfessional(establishmentId, professionalId);

        return workingHoursRepository.findByProfessionalId(professionalId)
                .stream()
                .map(WorkingHoursResponseDTO::new)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        WorkingHoursEntity entity = findWorkingHours(id);
        workingHoursRepository.delete(entity);
    }
}
