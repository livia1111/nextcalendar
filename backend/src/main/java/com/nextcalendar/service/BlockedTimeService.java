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
    private final com.nextcalendar.repository.WorkingHoursRepository workingHoursRepository;
    private final BlockedTimeMapper blockedTimeMapper;

    public BlockedTimeService(BlockedTimeRepository blockedTimeRepository,
                              ProfessionalRepository professionalRepository,
                              AppointmentRepository appointmentRepository,
                              com.nextcalendar.repository.WorkingHoursRepository workingHoursRepository,
                              BlockedTimeMapper blockedTimeMapper) {
        this.blockedTimeRepository = blockedTimeRepository;
        this.professionalRepository = professionalRepository;
        this.appointmentRepository = appointmentRepository;
        this.workingHoursRepository = workingHoursRepository;
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

        com.nextcalendar.config.SecurityUtils.getAuthenticatedUser().ifPresent(u -> {
            if (u.getRole() == com.nextcalendar.entity.UserRole.PROFESSIONAL) {
                ProfessionalEntity myProf = professionalRepository.findByUserId(u.getId())
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Perfil de profissional não localizado."));
                if (!myProf.getId().equals(professionalId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Profissionais só podem criar bloqueios para sua própria agenda.");
                }
            }
        });

        ProfessionalEntity professional = findProfessional(establishmentId, professionalId);

        if (!dto.startDateTime().isBefore(dto.endDateTime())) {
            throw new BusinessException("O horário de início deve ser anterior ao horário de término.");
        }

        // Validação de expediente: o bloqueio deve estar dentro do horário de trabalho do profissional
        com.nextcalendar.entity.WorkingHoursEntity workingHours = workingHoursRepository
                .findByProfessionalIdAndDayOfWeekAndActiveTrue(professionalId, dto.startDateTime().getDayOfWeek())
                .orElseThrow(() -> new BusinessException("O profissional não atende neste dia da semana (" + dto.startDateTime().getDayOfWeek() + ")."));

        java.time.LocalTime start = dto.startDateTime().toLocalTime();
        java.time.LocalTime end = dto.endDateTime().toLocalTime();

        if (start.isBefore(workingHours.getStartTime()) || end.isAfter(workingHours.getEndTime())) {
            throw new BusinessException("O horário do bloqueio deve estar dentro do expediente de trabalho cadastrado (" +
                    workingHours.getStartTime() + " às " + workingHours.getEndTime() + ").");
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
        com.nextcalendar.config.SecurityUtils.getAuthenticatedUser().ifPresent(u -> {
            if (u.getRole() == com.nextcalendar.entity.UserRole.PROFESSIONAL) {
                ProfessionalEntity myProf = professionalRepository.findByUserId(u.getId())
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Perfil de profissional não localizado."));
                if (!myProf.getId().equals(professionalId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Profissionais só podem visualizar seus próprios bloqueios.");
                }
            }
        });

        findProfessional(establishmentId, professionalId);

        return blockedTimeRepository.findByProfessionalIdOrderByStartDateTimeAsc(professionalId)
                .stream()
                .map(blockedTimeMapper::toResponseDTO)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        BlockedTimeEntity entity = findBlockedTime(id);

        com.nextcalendar.config.SecurityUtils.getAuthenticatedUser().ifPresent(u -> {
            if (u.getRole() == com.nextcalendar.entity.UserRole.PROFESSIONAL) {
                ProfessionalEntity myProf = professionalRepository.findByUserId(u.getId())
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Perfil de profissional não localizado."));
                if (!myProf.getId().equals(entity.getProfessional().getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("Profissionais só podem remover seus próprios bloqueios.");
                }
            }
        });

        blockedTimeRepository.delete(entity);
    }
}
