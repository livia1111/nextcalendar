package com.nextcalendar.service;

import com.nextcalendar.dto.client.*;
import com.nextcalendar.dto.login_register.RegisterRequestDTO;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ClientMapper;
import com.nextcalendar.repository.ClientRepository;

import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ClientService {
    private final ClientRepository clientRepository;

    private final ClientMapper clientMapper;

    public ClientService(ClientRepository clientRepository, ClientMapper clientMapper) {
        this.clientRepository=clientRepository;
        this.clientMapper=clientMapper;
    }

    @Transactional
    public ClientEntity createClientFromRegistration(UserEntity user, RegisterRequestDTO dto) {

        if (clientRepository.existsByEmail(user.getEmail())) {
            throw new BusinessException("O e-mail " + user.getEmail() + " já está cadastrado como cliente."
            );
        }

        ClientEntity client = new ClientEntity();

        client.setUser(user);
        client.setName(user.getName());
        client.setPhone(dto.phone());
        client.setEmail(user.getEmail());
        client.setDateOfBirth(dto.dateOfBirth());
        client.setPhotoUrl(dto.photoUrl());
        client.setNotes(dto.notes());
        client.setActive(true);

        return clientRepository.save(client);
    }

    @Transactional
    public ClientProfileResponseDTO createClient(ClientCreateDTO clientDto){

        if (clientRepository.existsByEmail(clientDto.email())){
            throw new BusinessException("o E-mail " + clientDto.email() + " já está cadastrado no sistema.");
        }
        ClientEntity client = clientMapper.toEntity(clientDto);

        ClientEntity savedClient = clientRepository.save(client);

        return new ClientProfileResponseDTO(savedClient);
    }

    @Transactional
    public ClientProfileResponseDTO updateClient(UUID id, ClientUpdateDTO clientDto){

        ClientEntity client = clientRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Cliente", id));

        String targetEmail = clientDto.email();

        if (targetEmail != null && !targetEmail.isBlank() && !targetEmail.equals(client.getEmail())) {
            if (clientRepository.existsByEmailAndIdNot(targetEmail, id)) {
                throw new BusinessException("O e-mail '" + targetEmail + "' já está sendo usado.");
            }
        }

        clientMapper.updateEntity(client, clientDto);

        if (client.getUser() != null) {
            if (clientDto.name() != null && !clientDto.name().isBlank()) {
                client.getUser().setName(clientDto.name());
            }
            if (targetEmail != null && !targetEmail.isBlank()) {
                client.getUser().setEmail(targetEmail);
            }
        }

        ClientEntity savedClient = clientRepository.save(client);

        return new ClientProfileResponseDTO(savedClient);
    }

    @Transactional(readOnly = true)
    public ClientDetailsResponseDTO findClientById(UUID id){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));
        return new ClientDetailsResponseDTO(client);
    }

    @Transactional(readOnly = true)
    public ClientDetailsResponseDTO findByUserId(UUID userId) {
        ClientEntity client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente para o usuário", userId));
        return new ClientDetailsResponseDTO(client);
    }

    @Transactional(readOnly = true)
    public Page<ClientMinResponseDTO> findClientsByName(String name, Pageable pageable){
       return clientRepository.findByNameContainingIgnoreCaseAndActiveTrue(name,pageable)
                .map(ClientMinResponseDTO::new);

    }

    @Transactional
    public void deleteClient(UUID id){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));
        client.setActive(false);
        clientRepository.save(client);
    }
}
