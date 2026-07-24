package com.nextcalendar.service;

import com.nextcalendar.dto.*;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ClientMapper;
import com.nextcalendar.repository.ClientRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.nextcalendar.exception.BusinessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;


import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@ExtendWith(MockitoExtension.class)
public class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ClientMapper clientMapper;

    private ClientService clientService;

    @BeforeEach
    void setup() {

        clientMapper = new ClientMapper(passwordEncoder);

        clientService = new ClientService(clientRepository, clientMapper);
    }

    @Nested
    @DisplayName("Testes de Criação de Cliente(createClient)")
    class CreateClientTests {
        @Test
        @DisplayName("Deve cadastrar cliente com sucesso quando o e-mail não existir")
        void shouldCreateClientSucessfully() {
            ClientCreateDTO dto = new ClientCreateDTO(
                    "Maria",
                    "51999999999",
                    "maria@email.com",
                    "12345678",
                    LocalDate.of(2000,1,1),
                    null,
                    "Alergia a pomada"
            );


            when(passwordEncoder.encode(dto.password())).thenReturn("senhaCriptografada");

            when(clientRepository.existsByEmail(dto.email())).thenReturn(false);

            when(clientRepository.save(any(ClientEntity.class)))
                    .thenAnswer(invocation -> {
                        ClientEntity entity = invocation.getArgument(0);

                        assertEquals("Maria", entity.getName());
                        assertEquals("maria@email.com", entity.getEmail());
                        assertEquals("senhaCriptografada", entity.getPassword());
                        assertTrue(entity.getActive());

                        return entity;
                    });

            ClientProfileResponseDTO response = clientService.createClient(dto);

            assertNotNull(response);

            assertEquals("Maria", response.name());
            assertEquals("maria@email.com", response.email());
            assertEquals("51999999999", response.phone());

            verify(passwordEncoder).encode(dto.password());

            verify(clientRepository).existsByEmail(dto.email());

            verify(clientRepository).save(any(ClientEntity.class));
        }

        @Test
        @DisplayName("Deve lançar BusinessException quando o e-mail já estiver cadastrado")
        void shouldThrowExceptionWhenEmailAlreadyExists() {
            ClientCreateDTO dto = new ClientCreateDTO(
                    "Maria",
                    "51999999999",
                    "duplicado@email.com",
                    "12345678",
                    LocalDate.of(2000,1,1),
                    null,
                    null
            );
            when(clientRepository.existsByEmail(dto.email())).thenReturn(true);

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> clientService.createClient(dto)
            );

            assertTrue(exception.getMessage().contains("já está cadastrado no sistema"));

            verify(clientRepository, never()).save(any(ClientEntity.class));
        }
    }

    @Nested
    @DisplayName("Testes de atualização de Cliente(updateClient)")
    public class UpdateClientTests{

        @Test
        @DisplayName("Deve atualizar cliente com sucesso quando os dados forem válidos")
        void shouldUpdateClientSucessfully(){
            UUID clientId = UUID.randomUUID();

            ClientUpdateDTO updateDto = new ClientUpdateDTO(
                    "Maria Silva",
                    "51999999999",
                    "novo@email.com",
                    null,
                    "Alergia a pomada"
            );

            ClientEntity existingClient = new ClientEntity();
            existingClient.setId(clientId);
            existingClient.setName("Maria");
            existingClient.setEmail("antigo@email.com");

            when(clientRepository.findById(clientId)).thenReturn(Optional.of(existingClient));

            when(clientRepository.existsByEmailAndIdNot(updateDto.email(), clientId)).thenReturn(false);

            when(clientRepository.save(any(ClientEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ClientProfileResponseDTO response = clientService.updateClient(clientId, updateDto);

            assertNotNull(response);
            assertEquals("Maria Silva", response.name());
            assertEquals("novo@email.com", response.email());

            verify(clientRepository, times(1)).findById(clientId);
            verify(clientRepository, times(1)).save(existingClient);
        }

        @Test
        @DisplayName("Deve lançar EntityNotFoundException quando o cliente não existir")
        void shouldThrowExceptionWhenClientNotFound() {

            UUID invalidId = UUID.randomUUID();
            ClientUpdateDTO updateDto = new ClientUpdateDTO("Maria", null, null, null, null);

            when(clientRepository.findById(invalidId)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> clientService.updateClient(invalidId, updateDto)
            );

            verify(clientRepository, never()).save(any(ClientEntity.class));
        }

        @Test
        @DisplayName("Deve lançar BusinessException quando novo e-mail já pertencer a outro cliente")
        void shouldThrowExceptionWhenEmailInUseByAnotherClient() {

            UUID clientId = UUID.randomUUID();
            ClientUpdateDTO updateDto = new ClientUpdateDTO("Maria", null, "duplicado@email.com", null, null);

            ClientEntity existingClient = new ClientEntity();
            existingClient.setId(clientId);
            existingClient.setEmail("antigo@email.com");

            when(clientRepository.findById(clientId)).thenReturn(Optional.of(existingClient));

            when(clientRepository.existsByEmailAndIdNot("duplicado@email.com", clientId)).thenReturn(true);

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> clientService.updateClient(clientId, updateDto)
            );

            assertTrue(exception.getMessage().contains("já está sendo usado por outro cliente"));

            verify(clientRepository, never()).save(any(ClientEntity.class));
        }

    }

    @Nested
    @DisplayName("Testes de Busca por ID (findClientById)")
    class FindClientByIdTests {

        @Test
        @DisplayName("Deve retornar detalhes do cliente quando o ID existir")
        void shouldReturnClientProfileWhenIdExists() {
            UUID clientId = UUID.randomUUID();
            ClientEntity client = new ClientEntity();
            client.setId(clientId);
            client.setName("Maria");
            client.setEmail("maria@email.com");

            when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));

            ClientDetailsResponseDTO response = clientService.findClientById(clientId);

            assertNotNull(response);
            assertEquals("Maria", response.name());
            assertEquals("maria@email.com", response.email());

            verify(clientRepository, times(1)).findById(clientId);
        }

        @Test
        @DisplayName("Deve lançar EntityNotFoundException quando o ID não existir")
        void shouldThrowExceptionWhenIdDoesNotExist() {
            UUID invalidId = UUID.randomUUID();
            when(clientRepository.findById(invalidId)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> clientService.findClientById(invalidId)
            );

            verify(clientRepository, times(1)).findById(invalidId);
        }
    }

    @Nested
    @DisplayName("Testes de Busca por Nome (findClientsByName)")
    class FindClientsByNameTests {

        @Test
        @DisplayName("Deve retornar lista paginada de clientes ativos quando houver correspondência")
        void shouldReturnPagedClientsListWhenNameMatches() {

            String nameQuery = "Maria";
            Pageable pageable = PageRequest.of(0, 10);

            ClientEntity client = new ClientEntity();
            client.setId(UUID.randomUUID());
            client.setName("Maria Silva");
            client.setActive(true);

            Page<ClientEntity> clientPage = new PageImpl<>(List.of(client), pageable, 1);

            when(clientRepository.findByNameContainingIgnoreCaseAndActiveTrue(nameQuery, pageable))
                    .thenReturn(clientPage);

            Page<ClientMinResponseDTO> response = clientService.findClientsByName(nameQuery, pageable);

            assertNotNull(response);
            assertEquals(1, response.getTotalElements());
            assertEquals(1, response.getTotalPages());
            assertEquals("Maria Silva", response.getContent().get(0).name());

            verify(clientRepository, times(1)).findByNameContainingIgnoreCaseAndActiveTrue(nameQuery, pageable);
        }
    }

    @Nested
    @DisplayName("Testes de Deleção de Cliente (deleteClient)")
    class DeleteClientTests {

        @Test
        @DisplayName("Deve inativar o cliente (soft delete) quando o ID existir")
        void shouldInactivateClientSuccessfullyWhenIdExists() {
            UUID clientId = UUID.randomUUID();
            ClientEntity client = new ClientEntity();
            client.setId(clientId);
            client.setActive(true);

            when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(clientRepository.save(any(ClientEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            assertDoesNotThrow(() -> clientService.deleteClient(clientId));

            assertFalse(client.getActive());
            verify(clientRepository, times(1)).findById(clientId);
            verify(clientRepository, times(1)).save(client);
        }

        @Test
        @DisplayName("Deve lançar EntityNotFoundException ao tentar deletar ID inexistente")
        void shouldThrowExceptionWhenDeletingNonExistingId() {
            UUID invalidId = UUID.randomUUID();
            when(clientRepository.findById(invalidId)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> clientService.deleteClient(invalidId)
            );

            verify(clientRepository, times(1)).findById(invalidId);
            verify(clientRepository, never()).save(any());
        }
    }
}
