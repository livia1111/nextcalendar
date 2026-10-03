package com.nextcalendar.controller;

import com.nextcalendar.dto.photo.PhotoUploadDTO;
import com.nextcalendar.dto.photo.PhotoUploadResponseDTO;
import com.nextcalendar.entity.PhotoEntity;
import com.nextcalendar.service.PhotoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/photos")
public class PhotoController {

    private final PhotoService photoService;

    public PhotoController(PhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoUploadResponseDTO upload(@Valid @RequestBody PhotoUploadDTO dto) {
        return photoService.upload(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable UUID id) {
        PhotoEntity photo = photoService.findById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .body(photo.getData());
    }
}