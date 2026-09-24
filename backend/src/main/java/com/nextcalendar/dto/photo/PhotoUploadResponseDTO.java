package com.nextcalendar.dto.photo;

import java.util.UUID;

public record PhotoUploadResponseDTO(
        UUID id,
        String url
) {}
