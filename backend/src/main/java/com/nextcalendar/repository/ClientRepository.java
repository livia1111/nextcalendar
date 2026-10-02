package com.nextcalendar.repository;

import com.nextcalendar.entity.ClientEntity;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {


    @EntityGraph(attributePaths = {"user"})
    Optional<ClientEntity> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"user"})
    boolean existsByUserId(UUID userId);

    @Query("SELECT c FROM ClientEntity c WHERE (c.user.email = :email OR c.email = :email)")
    Optional<ClientEntity> findByEmail(@Param("email")String email);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM ClientEntity c WHERE (c.user.email = :email OR c.email = :email)")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM ClientEntity c WHERE (c.user.email = :email OR c.email = :email) AND c.id != :id")
    boolean existsByEmailAndIdNot(@Param("email") String email, @Param("id") UUID id);

    @Query(value = "SELECT c FROM ClientEntity c LEFT JOIN FETCH c.user WHERE c.active = true AND " +
            "(LOWER(c.user.name) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%')))",
            countQuery = "SELECT COUNT(c) FROM ClientEntity c WHERE c.active = true AND " +
                    "(LOWER(c.user.name) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<ClientEntity> findByNameContainingIgnoreCaseAndActiveTrue(@Param("name") String name, Pageable pageable);

    boolean existsByPhone(String phone);

}
