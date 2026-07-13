package com.nextcalendar.dto;

public record ClientUpdateDTO(
        String name,
        String phone,
        String email,
        String photoUrl,
        String notes) {
}
