package com.nextcalendar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PhotoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Lob
    @Column(nullable = false, columnDefinition = "BLOB")
    private byte[] data;

    @Column(nullable = false)
    private String contentType;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
