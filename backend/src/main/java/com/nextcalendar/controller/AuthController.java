package com.nextcalendar.controller;

import com.nextcalendar.dto.login_register.LoginRequestDTO;
import com.nextcalendar.dto.login_register.LoginResponseDTO;
import com.nextcalendar.dto.login_register.RegisterRequestDTO;
import com.nextcalendar.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/v1/auth/login
     *
     * Body: { "email": "...", "password": "..." }
     * Retorna: { "token": "eyJ...", "user": { "id", "name", "email" } }
     *
     * Erros:
     *   400 — Email ou senha inválidos
     *   422 — Campos obrigatórios ausentes ou mal formatados
     */
    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO dto) {
        return authService.login(dto);
    }

    /**
     * POST /api/v1/auth/register
     *
     * Body: { "name": "...", "email": "...", "password": "..." }
     * Retorna: { "token": "eyJ...", "user": { "id", "name", "email" } }
     *
     * Erros:
     *   409 — Email já cadastrado
     *   422 — Campos inválidos
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public LoginResponseDTO register(@Valid @RequestBody RegisterRequestDTO dto) {
        return authService.register(dto);
    }

    /**
     * POST /api/v1/auth/change-password
     *
     * Autenticado. O userId é extraído do token JWT (header Authorization: Bearer ...).
     * NUNCA aceita userId vindo do payload.
     *
     * Body: { "currentPassword": "...", "newPassword": "..." }
     * Retorna: 204 No Content em caso de sucesso.
     *
     * Erros:
     *   400 — Senha atual incorreta / nova senha igual à atual / nova senha < 8 chars
     *   401 — Token ausente ou inválido
     */
    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @Valid @RequestBody com.nextcalendar.dto.login_register.ChangePasswordRequestDTO dto,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.nextcalendar.exception.BusinessException("Token de autenticação ausente ou inválido.");
        }
        java.util.UUID userId = authService.extractUserIdFromToken(authHeader.substring(7));
        authService.changePassword(userId, dto);
    }
}
