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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TechnicalSheetService {

    private final TechnicalSheetRepository technicalSheetRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final TechnicalSheetMapper technicalSheetMapper;

    public TechnicalSheetService(TechnicalSheetRepository technicalSheetRepository,
                                 ClientRepository clientRepository,
                                 AppointmentRepository appointmentRepository,
                                 TechnicalSheetMapper technicalSheetMapper) {
        this.technicalSheetRepository = technicalSheetRepository;
        this.clientRepository = clientRepository;
        this.appointmentRepository = appointmentRepository;
        this.technicalSheetMapper = technicalSheetMapper;
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
        return new TechnicalSheetResponseDTO(findOrCreateSheet(clientId));
    }

    @Transactional
    public TechnicalSheetResponseDTO updateObservations(UUID clientId, TechnicalSheetUpdateDTO dto) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);
        sheet.setObservations(dto.observations());

        TechnicalSheetEntity savedSheet = technicalSheetRepository.save(sheet);
        return new TechnicalSheetResponseDTO(savedSheet);
    }

    @Transactional
    public TechnicalSheetResponseDTO addEntry(UUID clientId, TechnicalSheetEntryCreateDTO dto) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);

        AppointmentEntity appointment = appointmentRepository.findById(dto.appointmentId())
                .orElseThrow(() -> new EntityNotFoundException("Agendamento", dto.appointmentId()));

        if (appointment.getClient() == null || !appointment.getClient().getId().equals(clientId)) {
            throw new BusinessException("Esse agendamento não pertence a este cliente.");
        }

        TechnicalSheetEntryEntity entry = technicalSheetMapper.toEntryEntity(
                sheet, appointment, dto.notes(), dto.photoUrls()
        );
        sheet.getEntries().add(entry);

        TechnicalSheetEntity savedSheet = technicalSheetRepository.save(sheet);
        return new TechnicalSheetResponseDTO(savedSheet);
    }

    @Transactional
    public TechnicalSheetResponseDTO removeEntry(UUID clientId, UUID entryId) {
        TechnicalSheetEntity sheet = findOrCreateSheet(clientId);

        boolean removido = sheet.getEntries().removeIf(entry -> entry.getId().equals(entryId));
        if (!removido) {
            throw new EntityNotFoundException("Registro da ficha técnica", entryId);
        }

        TechnicalSheetEntity savedSheet = technicalSheetRepository.save(sheet);
        return new TechnicalSheetResponseDTO(savedSheet);
    }
}