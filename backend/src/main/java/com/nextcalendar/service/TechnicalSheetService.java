package com.nextcalendar.service;

import com.nextcalendar.dto.technicalsheet.TechnicalSheetEntryCreateDTO;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetResponseDTO;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetUpdateDTO;
import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.entity.TechnicalSheetEntity;
import com.nextcalendar.entity.TechnicalSheetEntryEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.TechnicalSheetMapper;
import com.nextcalendar.repository.AppointmentRepository;
import com.nextcalendar.repository.ClientRepository;
import com.nextcalendar.repository.TechnicalSheetRepository;

import com.nextcalendar.entity.ProfessionalEntity;
import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.entity.UserRole;
import com.nextcalendar.repository.ProfessionalRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TechnicalSheetService {

    private final TechnicalSheetRepository technicalSheetRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final TechnicalSheetMapper technicalSheetMapper;
    private final ProfessionalRepository professionalRepository;

    public TechnicalSheetService(TechnicalSheetRepository technicalSheetRepository,
                                 ClientRepository clientRepository,
                                 AppointmentRepository appointmentRepository,
                                 TechnicalSheetMapper technicalSheetMapper,
                                 ProfessionalRepository professionalRepository) {
        this.technicalSheetRepository = technicalSheetRepository;
        this.clientRepository = clientRepository;
        this.appointmentRepository = appointmentRepository;
        this.technicalSheetMapper = technicalSheetMapper;
        this.professionalRepository = professionalRepository;
    }

    private ClientEntity findClient(UUID clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente", clientId));
    }


    private TechnicalSheetEntity findOrCreateSheet(UUID clientId) {
        ClientEntity client = findClient(clientId);

        return technicalSheetRepository.findByClientId(clientId)
                .orElseGet(() -> technicalSheetRepository.save(technicalSheetMapper.toEntity(client)));
    }

    @Transactional
    public TechnicalSheetResponseDTO findByClient(UUID clientId) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);
        TechnicalSheetResponseDTO dto = new TechnicalSheetResponseDTO(sheet);

        Optional<UserEntity> userOpt = com.nextcalendar.config.SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == UserRole.PROFESSIONAL) {
            UUID profId = professionalRepository.findByUserId(userOpt.get().getId())
                    .map(ProfessionalEntity::getId).orElse(null);
            List<com.nextcalendar.dto.technicalsheet.TechnicalSheetEntryResponseDTO> filteredEntries = dto.entries().stream()
                    .filter(e -> e.professionalId() != null && e.professionalId().equals(profId))
                    .toList();
            return new TechnicalSheetResponseDTO(
                    dto.id(), dto.clientId(), dto.clientName(), dto.observations(),
                    filteredEntries, dto.createdAt(), dto.updatedAt()
            );
        }
        return dto;
    }

    @Transactional
    public TechnicalSheetResponseDTO updateObservations(UUID clientId, TechnicalSheetUpdateDTO dto) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);
        sheet.setObservations(dto.observations());

        TechnicalSheetEntity savedSheet = technicalSheetRepository.save(sheet);
        return findByClient(clientId);
    }

    @Transactional
    public TechnicalSheetResponseDTO addEntry(UUID clientId, TechnicalSheetEntryCreateDTO dto) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);

        AppointmentEntity appointment = appointmentRepository.findById(dto.appointmentId())
                .orElseThrow(() -> new EntityNotFoundException("Agendamento", dto.appointmentId()));

        if (appointment.getClient() == null || !appointment.getClient().getId().equals(clientId)) {
            throw new BusinessException("Esse agendamento não pertence a este cliente.");
        }

        com.nextcalendar.config.SecurityUtils.getAuthenticatedUser().ifPresent(u -> {
            if (u.getRole() == UserRole.PROFESSIONAL) {
                ProfessionalEntity myProf = professionalRepository.findByUserId(u.getId())
                        .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
                if (!appointment.getProfessional().getId().equals(myProf.getId())) {
                    throw new AccessDeniedException("Profissionais só podem registrar atendimentos para seus próprios agendamentos.");
                }
            }
        });

        TechnicalSheetEntryEntity entry = technicalSheetMapper.toEntryEntity(
                sheet, appointment, dto.notes(), dto.photoUrls()
        );
        sheet.getEntries().add(entry);

        technicalSheetRepository.save(sheet);
        return findByClient(clientId);
    }

    @Transactional
    public TechnicalSheetResponseDTO removeEntry(UUID clientId, UUID entryId) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);

        TechnicalSheetEntryEntity targetEntry = sheet.getEntries().stream()
                .filter(entry -> entry.getId().equals(entryId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Registro da ficha técnica", entryId));

        com.nextcalendar.config.SecurityUtils.getAuthenticatedUser().ifPresent(u -> {
            if (u.getRole() == UserRole.PROFESSIONAL) {
                ProfessionalEntity myProf = professionalRepository.findByUserId(u.getId())
                        .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
                if (!targetEntry.getProfessional().getId().equals(myProf.getId())) {
                    throw new AccessDeniedException("Profissionais só podem remover registros dos seus próprios atendimentos.");
                }
            }
        });

        sheet.getEntries().remove(targetEntry);
        technicalSheetRepository.save(sheet);
        return findByClient(clientId);
    }
}