package com.nextcalendar.controller;

import com.nextcalendar.dto.ClientCreateDTO;
import com.nextcalendar.dto.ClientDetailsResponseDTO;
import com.nextcalendar.dto.ClientProfileResponseDTO;
import com.nextcalendar.dto.ClientUpdateDTO;
import com.nextcalendar.service.ClientService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public ClientProfileResponseDTO createClient(@RequestBody ClientCreateDTO clientDto){return clientService.createClient(clientDto);}

    @GetMapping("/{id}")
    public ClientDetailsResponseDTO findClientById(@PathVariable UUID id){return clientService.findClientById(id);}

    @GetMapping("/search")
    public List<ClientDetailsResponseDTO> findClientsByName(@RequestParam String name){return clientService.findClientsByName(name);}

    @PutMapping("/{id}")
    public ClientProfileResponseDTO updateClient(@PathVariable UUID id, @RequestBody ClientUpdateDTO dto){return clientService.updateClient(id,dto);}

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable UUID id){clientService.deleteClient(id);}
}
