package com.nextcalendar.config;

import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.entity.UserRole;
import com.nextcalendar.exception.BusinessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UserEntity> getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserEntity user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public static UserEntity getRequiredAuthenticatedUser() {
        return getAuthenticatedUser()
                .orElseThrow(() -> new AccessDeniedException("Usuário não autenticado."));
    }

    public static void requireRole(UserRole role) {
        UserEntity user = getRequiredAuthenticatedUser();
        if (user.getRole() != role) {
            throw new AccessDeniedException("Acesso restrito para o perfil " + role + ".");
        }
    }

    public static boolean hasRole(UserRole role) {
        return getAuthenticatedUser().map(u -> u.getRole() == role).orElse(false);
    }
}
