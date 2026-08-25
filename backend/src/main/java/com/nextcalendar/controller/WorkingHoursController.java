package com.nextcalendar.controller;

import com.nextcalendar.dto.appointment.WorkingHoursCreateDTO;
import com.nextcalendar.dto.appointment.WorkingHoursResponseDTO;
import com.nextcalendar.dto.appointment.WorkingHoursUpdateDTO;
import com.nextcalendar.service.WorkingHoursService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/establishments/{establishmentId}/professionals/{professionalId}/working-hours")
public class WorkingHoursController {
    private final WorkingHoursService workingHoursService;

    public WorkingHoursController(WorkingHoursService workingHoursService) {
        this.workingHoursService = workingHoursService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkingHoursResponseDTO create(
            @PathVariable UUID establishmentId,
            @PathVariable UUID professionalId,
            @Valid @RequestBody WorkingHoursCreateDTO dto
    ) {return workingHoursService.create(establishmentId, professionalId, dto);}

    @PutMapping("/{id}")
    public WorkingHoursResponseDTO update(
            @PathVariable UUID establishmentId,
            @PathVariable UUID professionalId,
            @PathVariable UUID id,
            @RequestBody WorkingHoursUpdateDTO dto
    ) {return workingHoursService.update(establishmentId, professionalId, id, dto);}

    @GetMapping
    public List<WorkingHoursResponseDTO> findByProfessional(@PathVariable UUID establishmentId, @PathVariable UUID professionalId) {
        return workingHoursService.findByProfessional(establishmentId, professionalId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {workingHoursService.delete(id);}
}
