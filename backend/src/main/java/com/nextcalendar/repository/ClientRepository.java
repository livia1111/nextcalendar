package com.nextcalendar.repository;

import com.nextcalendar.entity.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {

    Optional<ClientEntity> findByEmail(String email);
    //Optional<ClientEntity> findByCpf(String cpf);

    List<ClientEntity> findByNameContainingIgnoreCase(String name);

}
