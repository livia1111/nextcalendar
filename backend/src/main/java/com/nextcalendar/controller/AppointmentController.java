package com.nextcalendar.controller;

import com.nextcalendar.dto.appointment.AppointmentCreateDTO;
import com.nextcalendar.dto.appointment.AppointmentRescheduleDTO;
import com.nextcalendar.dto.appointment.AppointmentResponseDTO;
import com.nextcalendar.dto.appointment.AvailableSlotsResponseDTO;
import com.nextcalendar.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/establishments/{establishmentId}/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/available-slots")
    public AvailableSlotsResponseDTO getAvailableSlots(
            @PathVariable UUID establishmentId,
            @RequestParam UUID professionalId,
            @RequestParam UUID serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return appointmentService.findAvailableSlots(establishmentId, professionalId, serviceId, date);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponseDTO createAppointment(@PathVariable UUID establishmentId, @Valid @RequestBody AppointmentCreateDTO dto) {
        return appointmentService.createAppointment(establishmentId, dto);
    }

    @PatchMapping("/{id}/cancel")
    public AppointmentResponseDTO cancelAppointment(@PathVariable UUID establishmentId, @PathVariable UUID id) {
        return appointmentService.cancelAppointment(id);
    }

    @PutMapping("/{id}/reschedule")
    public AppointmentResponseDTO rescheduleAppointment(
            @PathVariable UUID establishmentId,
            @PathVariable UUID id,
            @Valid @RequestBody AppointmentRescheduleDTO dto
    ) {
        return appointmentService.rescheduleAppointment(id, dto);
    }

    @GetMapping("/client/{clientId}")
    public List<AppointmentResponseDTO> findByClient(@PathVariable UUID establishmentId, @PathVariable UUID clientId) {
        return appointmentService.findByClient(clientId);
    }

}

