package com.nextcalendar.dto;

import com.nextcalendar.entity.ClientEntity;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


public record ClientDetailsResponseDTO(
        UUID id,
        String name,
        String phone,
        String email,
        LocalDate dateOfBirth,
        String photoUrl,
        String notes,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public ClientDetailsResponseDTO(ClientEntity client) {
        this(
                client.getId(),
                client.getName(),
                client.getPhone(),
                client.getEmail(),
                client.getDateOfBirth(),
                client.getPhotoUrl(),
                client.getNotes(),
                client.getActive(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }
}
