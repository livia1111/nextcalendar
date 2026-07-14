package com.nextcalendar.mapper;

import com.nextcalendar.dto.ClientCreateDTO;
import com.nextcalendar.dto.ClientUpdateDTO;
import com.nextcalendar.entity.ClientEntity;

public class ClientMapper {
    public static ClientEntity toEntity(ClientCreateDTO dto){
        ClientEntity client = new ClientEntity();

        client.setName(dto.name());
        client.setPhone(dto.phone());
        client.setEmail(dto.email());
        client.setDateOfBirth(dto.dateOfBirth());
        client.setPhotoUrl(dto.photoUrl());
        client.setNotes(dto.notes());
        client.setActive(true);

        return client;
    }

    public  static void updateEntity(ClientEntity client, ClientUpdateDTO dto){

        client.setName(dto.name());
        client.setPhone(dto.phone());
        client.setEmail(dto.email());
        client.setPhotoUrl(dto.photoUrl());
        client.setNotes(dto.notes());

    }
}
