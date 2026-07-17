package com.nextcalendar.service;

import com.nextcalendar.dto.ClientCreateDTO;
import com.nextcalendar.dto.ClientDetailsResponseDTO;
import com.nextcalendar.dto.ClientProfileResponseDTO;
import com.nextcalendar.dto.ClientUpdateDTO;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ClientMapper;
import com.nextcalendar.repository.ClientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ClientService {
    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository=clientRepository;
    }

    public ClientProfileResponseDTO createClient(ClientCreateDTO clientDto){

        ClientEntity client = ClientMapper.toEntity(clientDto);

        ClientEntity savedClient = clientRepository.save(client);

        return new ClientProfileResponseDTO(savedClient);
    }


    public ClientProfileResponseDTO updateClient(UUID id, ClientUpdateDTO clientDto){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));

        ClientMapper.updateEntity(client,clientDto);

        ClientEntity savedClient = clientRepository.save(client);

        return new ClientProfileResponseDTO(savedClient);
    }

    public ClientDetailsResponseDTO findClientById(UUID id){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));
        return new ClientDetailsResponseDTO(client);
    }

    //depois criar um dto mais simples apenas para a listagem dos clientes quando o profissional pesquisar
    public List<ClientDetailsResponseDTO> findClientsByName(String name){
       return clientRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(ClientDetailsResponseDTO::new)
                .toList();

    }

    public void deleteClient(UUID id){
        ClientEntity client = clientRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Cliente",id));
        client.setActive(false);
        clientRepository.save(client);
    }
}
