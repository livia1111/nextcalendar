package com.nextcalendar.mapper;

import com.nextcalendar.dto.ClientCreateDTO;
import com.nextcalendar.dto.ClientUpdateDTO;
import com.nextcalendar.entity.ClientEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class ClientMapper {

    private final PasswordEncoder passwordEncoder;

    public ClientMapper(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }



    public ClientEntity toEntity(ClientCreateDTO dto){
        ClientEntity client = new ClientEntity();

        client.setName(dto.name());
        client.setPhone(dto.phone());
        client.setEmail(dto.email());
        client.setPassword(passwordEncoder.encode(dto.password()));
        client.setDateOfBirth(dto.dateOfBirth());
        client.setPhotoUrl(dto.photoUrl());
        client.setNotes(dto.notes());
        client.setActive(true);

        return client;
    }

    public void updateEntity(ClientEntity client, ClientUpdateDTO dto){

        if(dto.name() != null && !dto.name().isEmpty()){
            client.setName(dto.name());
        }
        if (dto.phone() != null && !dto.phone().isBlank()) {
            client.setPhone(dto.phone());
        }

        if (dto.email() != null && !dto.email().isBlank()) {
            client.setEmail(dto.email());
        }

        if (dto.photoUrl() != null) {
            client.setPhotoUrl(dto.photoUrl());
        }

        if (dto.notes() != null) {
            client.setNotes(dto.notes());
        }
    }
}
