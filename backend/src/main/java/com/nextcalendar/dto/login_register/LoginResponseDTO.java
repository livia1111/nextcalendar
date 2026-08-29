package com.nextcalendar.dto.login_register;

import com.nextcalendar.entity.UserRole;

import java.util.UUID;

/**
 * Resposta de login — formato exato que o frontend (authServices.ts) espera.
 *
 * {
 *   "token": "eyJ...",
 *   "user": { "id": "uuid", "name": "Pedro", "email": "pedro@email.com" }
 * }
 */
public record LoginResponseDTO(
        String token,
        UserInfoDTO user
) {
    public record UserInfoDTO(
            UUID id,
            String name,
            String email,
            UserRole role
    ) {}
}
