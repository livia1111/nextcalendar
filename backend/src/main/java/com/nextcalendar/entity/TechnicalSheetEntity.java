package com.nextcalendar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "technical_sheets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor


public class TechnicalSheetEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "client_id", nullable = false, unique = true)
    private ClientEntity client;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @OneToMany(mappedBy = "technicalSheet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TechnicalSheetEntryEntity> entries = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
