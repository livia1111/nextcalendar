package com.nextcalendar.dto;

import java.time.LocalDate;

public record ClientCreateDTO(
        String name,
        String phone,
        String email,
        LocalDate dateOfBirth,
        String photoUrl,
        String notes
        ){
}

