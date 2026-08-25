package com.nextcalendar.controller;

import com.nextcalendar.controller.openapi.ClientApi;
import com.nextcalendar.dto.client.*;
import com.nextcalendar.service.ClientService;
import jakarta.validation.Valid;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients")

public class ClientController implements ClientApi {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @Override
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientProfileResponseDTO createClient(@Valid @RequestBody ClientCreateDTO clientDto){return clientService.createClient(clientDto);}

    @Override
    @GetMapping("/{id}")
    public ClientDetailsResponseDTO findClientById(@PathVariable UUID id){return clientService.findClientById(id);}

    @GetMapping("/by-user/{userId}")
    public ClientDetailsResponseDTO findByUserId(@PathVariable UUID userId) {return clientService.findByUserId(userId);}

    @Override
    @GetMapping("/search")
    public Page<ClientMinResponseDTO> findClientsByName(@RequestParam(defaultValue = "") String name, @ParameterObject Pageable pageable){return clientService.findClientsByName(name, pageable);}

    @Override
    @PutMapping("/{id}")
    public ClientProfileResponseDTO updateClient(@PathVariable UUID id, @Valid @RequestBody ClientUpdateDTO dto){return clientService.updateClient(id,dto);}

    @Override
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable UUID id){clientService.deleteClient(id);}
}
