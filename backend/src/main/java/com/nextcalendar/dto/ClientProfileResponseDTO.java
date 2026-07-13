package com.nextcalendar.dto;

import com.nextcalendar.entity.ClientEntity;
import java.time.LocalDate;


public record ClientProfileResponseDTO(
        String name,
        String phone,
        String email,
        LocalDate dateOfBirth,
        String photoUrl,
        String notes) {

    public ClientProfileResponseDTO(ClientEntity client) {
        this(
                client.getName(),
                client.getPhone(),
                client.getEmail(),
                client.getDateOfBirth(),
                client.getPhotoUrl(),
                client.getNotes()
        );
    }
}
