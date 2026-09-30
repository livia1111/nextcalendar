package com.nextcalendar.dto.login_register;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload para POST /api/v1/auth/change-password.
 * O userId nunca vem aqui — é extraído do token JWT pelo controller.
 */
public record ChangePasswordRequestDTO(
        @NotBlank(message = "Senha atual é obrigatória")
        String currentPassword,

        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = 8, message = "A nova senha deve ter no mínimo 8 caracteres")
        String newPassword
) {}
