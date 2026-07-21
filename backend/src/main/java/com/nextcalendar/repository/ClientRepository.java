package com.nextcalendar.repository;

import com.nextcalendar.entity.ClientEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {

    Optional<ClientEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    Page<ClientEntity> findByNameContainingIgnoreCaseAndActiveTrue(String name, Pageable pageable);

}
