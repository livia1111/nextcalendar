package com.nextcalendar.entity;

import jakarta.persistence.*;

import java.sql.Timestamp;
import java.util.Date;

@Entity
@Table(name="cliente")

public class ClientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private int id;

    @ManyToOne
    @JoinColumn(name = "establishment_id")
    private EstablishmentEntity establishment;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;


    @Column(nullable = false)
    private String email;

    private Date dateOfBirth;
    private String photoUrl;
    private String notes;
    private Boolean active;
    private Timestamp createdAt;
    private Timestamp updatedAt;


}
