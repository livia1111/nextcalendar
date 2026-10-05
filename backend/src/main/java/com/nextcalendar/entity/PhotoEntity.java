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
@Table(name = "photos", indexes = {
        @Index(name = "idx_photos_appointment", columnList = "appointment_id"),
        @Index(name = "idx_photos_client", columnList = "client_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PhotoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private AppointmentEntity appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @Enumerated(EnumType.STRING)
    @Column(name = "photo_type", length = 50)
    private PhotoType type = PhotoType.OTHER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taken_by")
    private UserEntity takenBy;

    @Column(length = 500)
    private String caption;

    @Lob
    @Column(nullable = false, columnDefinition = "BLOB")
    private byte[] data;

    @Column(nullable = false)
    private String contentType;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
