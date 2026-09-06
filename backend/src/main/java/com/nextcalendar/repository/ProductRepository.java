package com.nextcalendar.repository;

import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProductEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {
    Page<ProductEntity> findByEstablishmentAndActiveTrue(EstablishmentEntity establishment, Pageable pageable);

    Page<ProductEntity> findByEstablishmentAndNameContainingIgnoreCaseAndActiveTrue(EstablishmentEntity establishment, String name, Pageable pageable);

    Optional<ProductEntity> findByIdAndEstablishmentAndActiveTrue(UUID id, EstablishmentEntity establishment);

    Optional<ProductEntity> findByIdAndActiveTrue(UUID id);

    Optional<ProductEntity> findByNameAndEstablishmentAndActiveFalse(String name, EstablishmentEntity establishment);

    boolean existsByNameAndEstablishmentAndActiveTrue(String name, EstablishmentEntity establishment);

    boolean existsByNameAndEstablishmentAndActiveTrueAndIdNot(String name, EstablishmentEntity establishment, UUID idProduct);

}
