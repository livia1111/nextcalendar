package com.nextcalendar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name = "professionals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class ProfessionalEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "establishment_id", nullable = false)
    private EstablishmentEntity establishment;


    @Column(nullable = false)
    private String name;

    private String nickname;

    @Column(length = 100)
    private String specialty;

    @Column(nullable = false, unique = true)
    private String cpf;


    @Column(nullable = false)
    private String email;

    private String password;

    private String phone;
    private String gender;
    private String photoUrl;

    @Column(precision = 5, scale = 2)
    private BigDecimal commission;

    private Boolean active;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
