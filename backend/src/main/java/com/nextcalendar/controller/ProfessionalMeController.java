package com.nextcalendar.controller;

import com.nextcalendar.dto.appointment.AppointmentResponseDTO;
import com.nextcalendar.dto.professional.ProfessionalMeResponseDTO;
import com.nextcalendar.service.AppointmentService;
import com.nextcalendar.service.ProfessionalService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/professionals")
public class ProfessionalMeController {

    private final ProfessionalService professionalService;
    private final AppointmentService appointmentService;

    public ProfessionalMeController(ProfessionalService professionalService,
                                  AppointmentService appointmentService) {
        this.professionalService = professionalService;
        this.appointmentService = appointmentService;
    }

    @GetMapping("/me")
    public ProfessionalMeResponseDTO getMe() {
        return professionalService.getMe();
    }

    @GetMapping("/by-user/{userId}")
    public ProfessionalMeResponseDTO getByUserId(@PathVariable UUID userId) {
        return professionalService.findByUserId(userId);
    }

    @GetMapping("/me/appointments")
    public List<AppointmentResponseDTO> getMyAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return appointmentService.findMyAppointments(date, from, to);
    }
}
