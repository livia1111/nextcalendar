package com.nextcalendar.dto;

import com.nextcalendar.entity.ClientEntity;

import java.util.UUID;

public record ClientMinResponseDTO(
    UUID id,
    String name,
    String phone,
    String email
){
    public ClientMinResponseDTO(ClientEntity entity) {
        this(entity.getId(), entity.getName(), entity.getPhone(), entity.getEmail());
    }
}
