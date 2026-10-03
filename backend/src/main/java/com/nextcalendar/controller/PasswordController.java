package com.nextcalendar.controller;

import com.nextcalendar.dto.professional.PasswordChangeDTO;
import com.nextcalendar.service.PasswordService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/professionals/me")
public class PasswordController {

    private final PasswordService passwordService;

    public PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @Operation(summary = "Trocar a própria senha",
            description = "O profissional (ou qualquer usuário) troca a senha informando a senha atual e a nova. Exige a senha atual correta.")
    @PatchMapping("/{userId}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable UUID userId,
            @Valid @RequestBody PasswordChangeDTO dto
    ) {
        passwordService.changePassword(userId, dto);
        return ResponseEntity.noContent().build();
    }
}
