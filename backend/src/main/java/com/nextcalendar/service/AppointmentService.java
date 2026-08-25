package com.nextcalendar.service;

import com.nextcalendar.dto.appointment.AppointmentCreateDTO;
import com.nextcalendar.dto.appointment.AppointmentRescheduleDTO;
import com.nextcalendar.dto.appointment.AppointmentResponseDTO;
import com.nextcalendar.dto.appointment.AvailableSlotsResponseDTO;
import com.nextcalendar.entity.*;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private static final int SLOT_STEP_MINUTES = 15;
    private static final int MIN_CANCEL_HOURS = 2;

    private final AppointmentRepository appointmentRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final BlockedTimeRepository blockedTimeRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final ClientRepository clientRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              WorkingHoursRepository workingHoursRepository,
                              BlockedTimeRepository blockedTimeRepository,
                              ProfessionalRepository professionalRepository,
                              ServiceRepository serviceRepository,
                              ClientRepository clientRepository)
    {
        this.appointmentRepository = appointmentRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.blockedTimeRepository = blockedTimeRepository;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.clientRepository = clientRepository;
    }

    private ProfessionalEntity findProfessional(UUID professionalId, UUID establishmentId) {
        return professionalRepository.findByIdAndEstablishmentId(professionalId, establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Profissional", professionalId));
    }

    private ServiceEntity findService(UUID serviceId, EstablishmentEntity establishment) {
        return serviceRepository.findByIdAndEstablishmentAndActiveTrue(serviceId, establishment)
                .orElseThrow(() -> new EntityNotFoundException("Serviço", serviceId));
    }

    private ClientEntity findClient(UUID clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente", clientId));
    }

    private AppointmentEntity findAppointment(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Agendamento", id));
    }

    private WorkingHoursEntity findWorkingHoursOrThrow(UUID professionalId, java.time.DayOfWeek dayOfWeek) {
        return workingHoursRepository.findByProfessionalIdAndDayOfWeekAndActiveTrue(professionalId, dayOfWeek)
                .orElseThrow(() -> new BusinessException("O profissional não atende neste dia da semana."));
    }


    @Transactional(readOnly = true)
    public AvailableSlotsResponseDTO findAvailableSlots(UUID establishmentId, UUID professionalId, UUID serviceId, LocalDate date) {

        ProfessionalEntity professional = findProfessional(professionalId, establishmentId);
        ServiceEntity service = findService(serviceId, professional.getEstablishment());

        WorkingHoursEntity workingHours = findWorkingHoursOrThrow(professionalId, date.getDayOfWeek());

        int durationMinutes = service.getDuration();

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        List<AppointmentEntity> existingAppointments = appointmentRepository
                .findByProfessionalIdAndStartDateTimeBetween(professionalId, dayStart, dayEnd);

        List<BlockedTimeEntity> blockedTimes = blockedTimeRepository
                .findByProfessionalIdAndStartDateTimeLessThanAndEndDateTimeGreaterThan(professionalId, dayEnd, dayStart);

        List<LocalTime> slots = new ArrayList<>();
        LocalTime cursor = workingHours.getStartTime();

        while (!cursor.plusMinutes(durationMinutes).isAfter(workingHours.getEndTime())) {

            LocalTime slotEnd = cursor.plusMinutes(durationMinutes);
            LocalDateTime slotStartDT = date.atTime(cursor);
            LocalDateTime slotEndDT = date.atTime(slotEnd);

            boolean duringLunch = workingHours.getBreakStart() != null
                    && cursor.isBefore(workingHours.getBreakEnd())
                    && slotEnd.isAfter(workingHours.getBreakStart());

            boolean conflictsWithAppointment = existingAppointments.stream().anyMatch(a ->
                    a.getStatus() != AppointmentStatus.CANCELLED
                            && slotStartDT.isBefore(a.getEndDateTime())
                            && slotEndDT.isAfter(a.getStartDateTime()));

            boolean conflictsWithBlock = blockedTimes.stream().anyMatch(b ->
                    slotStartDT.isBefore(b.getEndDateTime()) && slotEndDT.isAfter(b.getStartDateTime()));

            if (!duringLunch && !conflictsWithAppointment && !conflictsWithBlock) {
                slots.add(cursor);
            }

            cursor = cursor.plusMinutes(SLOT_STEP_MINUTES);
        }

        return new AvailableSlotsResponseDTO(
                service.getId(), service.getName(), service.getPrice(), service.getDuration(), date, slots
        );
    }

    @Transactional
    public AppointmentResponseDTO createAppointment(UUID establishmentId, AppointmentCreateDTO dto) {

        ProfessionalEntity professional = findProfessional(dto.professionalId(), establishmentId);
        ServiceEntity service = findService(dto.serviceId(), professional.getEstablishment());

        LocalDateTime start = dto.startDateTime();
        LocalDateTime end = start.plusMinutes(service.getDuration());

        boolean isFitIn = Boolean.TRUE.equals(dto.isFitIn());

        if (!isFitIn) {
            validateAvailability(dto.professionalId(), start, end, null);
        }

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setEstablishment(professional.getEstablishment());
        appointment.setProfessional(professional);
        appointment.setService(service);
        appointment.setStartDateTime(start);
        appointment.setEndDateTime(end);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setFitIn(isFitIn);
        appointment.setNotes(dto.notes());
        appointment.setClientNameFallback(dto.clientNameFallback());
        appointment.setClientPhoneFallback(dto.clientPhoneFallback());

        if (dto.clientId() != null) {
            appointment.setClient(findClient(dto.clientId()));
        }

        AppointmentEntity saved = appointmentRepository.save(appointment);
        return new AppointmentResponseDTO(saved);
    }

    @Transactional
    public AppointmentResponseDTO cancelAppointment(UUID id) {

        AppointmentEntity appointment = findAppointment(id);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Este agendamento já está cancelado.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.plusHours(MIN_CANCEL_HOURS).isAfter(appointment.getStartDateTime())) {
            throw new BusinessException(
                    "O cancelamento deve ser feito com pelo menos " + MIN_CANCEL_HOURS + " horas de antecedência.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        AppointmentEntity saved = appointmentRepository.save(appointment);
        return new AppointmentResponseDTO(saved);
    }

    @Transactional
    public AppointmentResponseDTO rescheduleAppointment(UUID id, AppointmentRescheduleDTO dto) {

        AppointmentEntity appointment = findAppointment(id);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Não é possível reagendar um agendamento cancelado.");
        }

        int durationMinutes = appointment.getService().getDuration();
        LocalDateTime newStart = dto.newStartDateTime();
        LocalDateTime newEnd = newStart.plusMinutes(durationMinutes);

        validateAvailability(appointment.getProfessional().getId(), newStart, newEnd, id);

        appointment.setStartDateTime(newStart);
        appointment.setEndDateTime(newEnd);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        AppointmentEntity saved = appointmentRepository.save(appointment);
        return new AppointmentResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> findByClient(UUID clientId) {
        return appointmentRepository.findByClientIdOrderByStartDateTimeDesc(clientId)
                .stream()
                .map(AppointmentResponseDTO::new)
                .toList();
    }

    private void validateAvailability(UUID professionalId, LocalDateTime start, LocalDateTime end, UUID excludeAppointmentId) {

        WorkingHoursEntity workingHours = findWorkingHoursOrThrow(professionalId, start.getDayOfWeek());

        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();

        if (startTime.isBefore(workingHours.getStartTime()) || endTime.isAfter(workingHours.getEndTime())) {
            throw new BusinessException("O horário selecionado está fora do expediente do profissional.");
        }

        boolean duringLunch = workingHours.getBreakStart() != null
                && startTime.isBefore(workingHours.getBreakEnd())
                && endTime.isAfter(workingHours.getBreakStart());

        if (duringLunch) {
            throw new BusinessException("O horário selecionado coincide com o intervalo de almoço do profissional.");
        }

        List<BlockedTimeEntity> blocks = blockedTimeRepository
                .findByProfessionalIdAndStartDateTimeLessThanAndEndDateTimeGreaterThan(professionalId, end, start);

        if (!blocks.isEmpty()) {
            throw new BusinessException("O horário selecionado está bloqueado na agenda do profissional.");
        }

        List<AppointmentEntity> conflitos = excludeAppointmentId == null
                ? appointmentRepository.findOverlapping(professionalId, AppointmentStatus.CANCELLED, start, end)
                : appointmentRepository.findOverlappingExcludingSelf(
                professionalId, excludeAppointmentId, AppointmentStatus.CANCELLED, start, end);

        if (!conflitos.isEmpty()) {
            throw new BusinessException("Este horário já está ocupado para o profissional selecionado.");
        }
    }
}