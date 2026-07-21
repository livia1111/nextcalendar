package com.nextcalendar.controller;

import com.nextcalendar.dto.*;
import com.nextcalendar.service.ClientService;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients")

public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientProfileResponseDTO createClient(@Valid @RequestBody ClientCreateDTO clientDto){return clientService.createClient(clientDto);}

    @GetMapping("/{id}")
    public ClientDetailsResponseDTO findClientById(@PathVariable UUID id){return clientService.findClientById(id);}

    @GetMapping("/search")
    public Page<ClientMinResponseDTO> findClientsByName(@RequestParam(defaultValue = "") String name, Pageable pageable){return clientService.findClientsByName(name, pageable);}

    @PutMapping("/{id}")
    public ClientProfileResponseDTO updateClient(@PathVariable UUID id, @Valid @RequestBody ClientUpdateDTO dto){return clientService.updateClient(id,dto);}

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable UUID id){clientService.deleteClient(id);}
}
