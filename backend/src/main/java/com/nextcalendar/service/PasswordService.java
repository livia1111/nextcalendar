package com.nextcalendar.service;

import com.nextcalendar.dto.professional.PasswordChangeDTO;
import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void changePassword(UUID userId, PasswordChangeDTO dto) {

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário", userId));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException("A senha atual informada está incorreta.");
        }

        if (passwordEncoder.matches(dto.newPassword(), user.getPasswordHash())) {
            throw new BusinessException("A nova senha deve ser diferente da senha atual.");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        userRepository.save(user);
    }
}
