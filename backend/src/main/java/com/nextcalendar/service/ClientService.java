package com.nextcalendar.service;

import com.nextcalendar.dto.*;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ClientMapper;
import com.nextcalendar.repository.ClientRepository;

import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Service
public class ClientService {
    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository=clientRepository;
    }

    public ClientProfileResponseDTO createClient(ClientCreateDTO clientDto){

        if (clientRepository.existsByEmail(clientDto.email())){
            throw new BusinessException("o E-mail " + clientDto.email() + " já está cadastrado no sistema.");
        }
        ClientEntity client = ClientMapper.toEntity(clientDto);

        ClientEntity savedClient = clientRepository.save(client);

        return new ClientProfileResponseDTO(savedClient);
    }


    public ClientProfileResponseDTO updateClient(UUID id, ClientUpdateDTO clientDto){

        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));

        if(clientDto.email() != null && !clientDto.email().isBlank() && !clientDto.email().equals(client.getEmail())){
            if (clientRepository.existsByEmailAndIdNot(clientDto.email(), id)) {
                throw new BusinessException("O e-mail '" + clientDto.email() + "' já está sendo usado por outro cliente.");
            }
        }

        ClientMapper.updateEntity(client,clientDto);

        ClientEntity savedClient = clientRepository.save(client);

        return new ClientProfileResponseDTO(savedClient);
    }

    public ClientDetailsResponseDTO findClientById(UUID id){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));
        return new ClientDetailsResponseDTO(client);
    }

    //depois criar um dto mais simples apenas para a listagem dos clientes quando o profissional pesquisar
    public Page<ClientMinResponseDTO> findClientsByName(String name, Pageable pageable){
       return clientRepository.findByNameContainingIgnoreCaseAndActiveTrue(name,pageable)
                .map(ClientMinResponseDTO::new);

    }

    public void deleteClient(UUID id){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));
        client.setActive(false);
        clientRepository.save(client);
    }
}
