package com.nextcalendar.service;

import com.nextcalendar.dto.appointment.BlockedTimeCreateDTO;
import com.nextcalendar.dto.appointment.BlockedTimeResponseDTO;
import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.AppointmentStatus;
import com.nextcalendar.entity.BlockedTimeEntity;
import com.nextcalendar.entity.ProfessionalEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.BlockedTimeMapper;
import com.nextcalendar.repository.AppointmentRepository;
import com.nextcalendar.repository.BlockedTimeRepository;
import com.nextcalendar.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BlockedTimeService {
    private final BlockedTimeRepository blockedTimeRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppointmentRepository appointmentRepository;
    private final BlockedTimeMapper blockedTimeMapper;

    public BlockedTimeService(BlockedTimeRepository blockedTimeRepository,
                              ProfessionalRepository professionalRepository,
                              AppointmentRepository appointmentRepository,
                              BlockedTimeMapper blockedTimeMapper) {
        this.blockedTimeRepository = blockedTimeRepository;
        this.professionalRepository = professionalRepository;
        this.appointmentRepository = appointmentRepository;
        this.blockedTimeMapper = blockedTimeMapper;
    }

    private ProfessionalEntity findProfessional(UUID establishmentId, UUID professionalId) {
        return professionalRepository.findByIdAndEstablishmentId(professionalId, establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Profissional", professionalId));
    }

    private BlockedTimeEntity findBlockedTime(UUID id) {
        return blockedTimeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bloqueio de horário", id));
    }

    @Transactional
    public BlockedTimeResponseDTO create(UUID establishmentId, UUID professionalId, BlockedTimeCreateDTO dto) {

        ProfessionalEntity professional = findProfessional(establishmentId, professionalId);

        if (!dto.startDateTime().isBefore(dto.endDateTime())) {
            throw new BusinessException("O horário de início deve ser anterior ao horário de término.");
        }

        // Não permite bloquear em cima de um agendamento já existente
        List<AppointmentEntity> conflitosComAgendamento = appointmentRepository.findOverlapping(
                professionalId, AppointmentStatus.CANCELLED, dto.startDateTime(), dto.endDateTime());

        if (!conflitosComAgendamento.isEmpty()) {
            throw new BusinessException(
                    "Já existe um agendamento neste horário. Cancele ou reagende o cliente antes de bloquear.");
        }

        // Não permite dois bloqueios sobrepostos
        List<BlockedTimeEntity> conflitosComBloqueio = blockedTimeRepository
                .findByProfessionalIdAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
                        professionalId, dto.endDateTime(), dto.startDateTime());

        if (!conflitosComBloqueio.isEmpty()) {
            throw new BusinessException("Já existe um bloqueio cadastrado neste horário.");
        }

        BlockedTimeEntity entity = blockedTimeMapper.toEntity(dto, professional);
        BlockedTimeEntity saved = blockedTimeRepository.save(entity);

        return blockedTimeMapper.toResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<BlockedTimeResponseDTO> findByProfessional(UUID establishmentId, UUID professionalId) {
        findProfessional(establishmentId, professionalId);

        return blockedTimeRepository.findByProfessionalIdOrderByStartDateTimeAsc(professionalId)
                .stream()
                .map(blockedTimeMapper::toResponseDTO)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        BlockedTimeEntity entity = findBlockedTime(id);
        blockedTimeRepository.delete(entity);
    }
}
