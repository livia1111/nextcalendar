
package com.nextcalendar.controller;

import com.nextcalendar.dto.professional.ProfessionalMeResponseDTO;
import com.nextcalendar.service.ProfessionalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/professionals")
public class ProfessionalMeController {

    private final ProfessionalService professionalService;

    public ProfessionalMeController(ProfessionalService professionalService) {
        this.professionalService = professionalService;
    }

    @GetMapping("/me/{userId}")
    public ProfessionalMeResponseDTO getMyProfile(@PathVariable UUID userId) {
        return professionalService.getMyProfile(userId);
    }
}