package com.nextcalendar.service;

import com.nextcalendar.dto.ClientCreateDTO;
import com.nextcalendar.dto.ClientProfileResponseDTO;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.repository.ClientRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.nextcalendar.exception.BusinessException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
public class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ClientService clientService;

    @Nested
    @DisplayName("Testes de Criação de Cliente(createClient)")
    class CreateClientTestes {
        @Test
        @DisplayName("Deve cadastrar cliente com sucesso quando o e-mail não existir")
        void shouldCreateClientSucessfully() {
            ClientCreateDTO dto = new ClientCreateDTO(
                    "Maria",
                    "51999999999",
                    "maria@email.com",
                    LocalDate.of(2000,1,1),
                    null,
                    "Alergia a pomada"
            );

            when(clientRepository.existsByEmail(dto.email())).thenReturn(false);

            ClientEntity savedEntity = new ClientEntity();
            savedEntity.setId(UUID.randomUUID());
            savedEntity.setName(dto.name());
            savedEntity.setPhone(dto.phone());
            savedEntity.setEmail(dto.email());
            savedEntity.setDateOfBirth(dto.dateOfBirth());
            savedEntity.setNotes(dto.notes());

            when(clientRepository.save(any(ClientEntity.class))).thenReturn(savedEntity);

            // ACT
            ClientProfileResponseDTO response = clientService.createClient(dto);

            // ASSERT
            assertNotNull(response);
            assertEquals("Maria", response.name());
            assertEquals("maria@email.com", response.email());
            assertEquals("51999999999", response.phone());

            verify(clientRepository, times(1)).save(any(ClientEntity.class));
        }

        @Test
        @DisplayName("Deve lançar BusinessException quando o e-mail já estiver cadastrado")
        void shouldThrowExceptionWhenEmailAlreadyExists() {
            ClientCreateDTO dto = new ClientCreateDTO(
                    "Maria",
                    "51999999999",
                    "duplicado@email.com",
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
}
