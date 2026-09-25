package com.nextcalendar.repository;

import com.nextcalendar.entity.PhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PhotoRepository extends JpaRepository<PhotoEntity, UUID> {
}
