package com.nextcalendar.repository;

import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.entity.TechnicalSheetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TechnicalSheetRepository extends JpaRepository<TechnicalSheetEntity, UUID> {
    Optional<TechnicalSheetEntity> findByClient(ClientEntity client);

    Optional<TechnicalSheetEntity> findByClientId(UUID clientId);
}
