package com.nextcalendar.controller;

import com.nextcalendar.dto.attendance.AttendanceResponseDTO;
import com.nextcalendar.entity.AppointmentStatus;
import com.nextcalendar.service.AttendanceService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    private LocalDateTime parseDate(String s, boolean endOfDay) {
        if (s == null || s.isBlank()) return null;
        try {
            if (s.contains("T")) {
                return LocalDateTime.parse(s);
            }
            LocalDate date = LocalDate.parse(s);
            return endOfDay ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/api/v1/professionals/me/attendances")
    public Page<AttendanceResponseDTO> getMyAttendances(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) UUID clientId,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return attendanceService.getProfessionalAttendances(
                status,
                parseDate(from, false),
                parseDate(to, true),
                clientId,
                pageable
        );
    }

    @GetMapping("/api/v1/attendances")
    public Page<AttendanceResponseDTO> getEstablishmentAttendances(
            @RequestParam(required = false) UUID professionalId,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return attendanceService.getEstablishmentAttendances(
                professionalId,
                clientId,
                status,
                parseDate(from, false),
                parseDate(to, true),
                pageable
        );
    }

    @GetMapping("/api/v1/clients/{id}/attendances")
    public List<AttendanceResponseDTO> getClientAttendances(@PathVariable UUID id) {
        return attendanceService.getClientAttendances(id);
    }
}
