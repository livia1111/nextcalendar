package com.nextcalendar.controller;

import com.nextcalendar.controller.openapi.TechnicalSheetApi;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetEntryCreateDTO;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetResponseDTO;
import com.nextcalendar.dto.technicalsheet.TechnicalSheetUpdateDTO;
import com.nextcalendar.service.TechnicalSheetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients/{clientId}/technical-sheet")
public class TechnicalSheetController implements TechnicalSheetApi {

    private final TechnicalSheetService technicalSheetService;

    public TechnicalSheetController(TechnicalSheetService technicalSheetService) {
        this.technicalSheetService = technicalSheetService;
    }

    @Override
    @GetMapping
    public TechnicalSheetResponseDTO findByClient(@PathVariable UUID clientId) {
        return technicalSheetService.findByClient(clientId);
    }

    @Override
    @PatchMapping
    public TechnicalSheetResponseDTO updateObservations(@PathVariable UUID clientId, @Valid @RequestBody TechnicalSheetUpdateDTO dto) {
        return technicalSheetService.updateObservations(clientId, dto);
    }

    @Override
    @PostMapping("/entries")
    public TechnicalSheetResponseDTO addEntry(@PathVariable UUID clientId, @Valid @RequestBody TechnicalSheetEntryCreateDTO dto) {
        return technicalSheetService.addEntry(clientId, dto);
    }

    @Override
    @DeleteMapping("/entries/{entryId}")
    public TechnicalSheetResponseDTO removeEntry(@PathVariable UUID clientId, @PathVariable UUID entryId) {
        return technicalSheetService.removeEntry(clientId, entryId);
    }
}