package com.nextcalendar.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.repository.UserRepository;
import com.nextcalendar.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Filtro único que bloqueia (HTTP 403) qualquer requisição autenticada de um
 * usuário com {@code mustChangePassword = true}, exceto as rotas permitidas
 * para que ele possa trocar a senha antes de continuar.
 *
 * <p>Rotas liberadas mesmo com senha pendente:
 * <ul>
 *   <li>{@code POST /api/v1/auth/change-password}</li>
 *   <li>{@code POST /api/v1/auth/logout} (caso seja implementado)</li>
 *   <li>Rotas públicas ({@code /api/v1/auth/login}, {@code /h2-console}, etc.)</li>
 * </ul>
 *
 * <p>Requisições sem token são ignoradas — a segurança de autenticação cabe
 * a outro filtro ou ao próprio SecurityConfig.
 */
public class MustChangePasswordFilter extends OncePerRequestFilter {

    /** Rotas que um usuário com senha pendente pode acessar normalmente. */
    private static final Set<String> ALLOWED_PATHS = Set.of(
            "/api/v1/auth/change-password",
            "/api/v1/auth/logout",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/h2-console",
            "/swagger-ui",
            "/v3/api-docs"
    );

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public MustChangePasswordFilter(JwtService jwtService,
                                    UserRepository userRepository,
                                    ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Libera rotas permitidas sem verificação
        if (isAllowedPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Sem token — deixa o restante da cadeia lidar (será 401 ou rota pública)
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        UUID userId;
        try {
            userId = jwtService.extractUserId(token);
        } catch (Exception e) {
            // Token inválido — deixa o restante da cadeia rejeitar
            filterChain.doFilter(request, response);
            return;
        }

        Optional<UserEntity> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && Boolean.TRUE.equals(userOpt.get().getMustChangePassword())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    objectMapper.writeValueAsString(Map.of(
                            "status", 403,
                            "error", "Forbidden",
                            "message", "Você precisa trocar sua senha antes de continuar. " +
                                       "Use o endpoint POST /api/v1/auth/change-password."
                    ))
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Retorna true se o caminho começa com qualquer prefixo da lista de permitidos. */
    private boolean isAllowedPath(String path) {
        return ALLOWED_PATHS.stream().anyMatch(path::startsWith);
    }
}
