package com.nextcalendar.controller;

import com.nextcalendar.controller.openapi.BlockedTimeApi;
import com.nextcalendar.dto.appointment.BlockedTimeCreateDTO;
import com.nextcalendar.dto.appointment.BlockedTimeResponseDTO;
import com.nextcalendar.service.BlockedTimeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/establishments/{establishmentId}/professionals/{professionalId}/blocked-times")
public class BlockedTimeController implements BlockedTimeApi {

    private final BlockedTimeService blockedTimeService;

    public BlockedTimeController(BlockedTimeService blockedTimeService) {
        this.blockedTimeService = blockedTimeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BlockedTimeResponseDTO create(
            @PathVariable UUID establishmentId,
            @PathVariable UUID professionalId,
            @Valid @RequestBody BlockedTimeCreateDTO dto
    ) {
        return blockedTimeService.create(establishmentId, professionalId, dto);
    }

    @GetMapping
    public List<BlockedTimeResponseDTO> findByProfessional(@PathVariable UUID establishmentId, @PathVariable UUID professionalId)
    {return blockedTimeService.findByProfessional(establishmentId, professionalId);}

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {blockedTimeService.delete(id);}
}
