package com.nextcalendar.dto.photo;

import jakarta.validation.constraints.NotBlank;

public record PhotoUploadDTO(

        @NotBlank(message = "O conteúdo da imagem (base64) é obrigatório.")
        String content,

        @NotBlank(message = "O tipo do arquivo é obrigatório (ex: image/jpeg).")
        String contentType

) {}