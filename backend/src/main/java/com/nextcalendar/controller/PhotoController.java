package com.nextcalendar.controller;

import com.nextcalendar.dto.photo.PhotoResponseDTO;
import com.nextcalendar.dto.photo.PhotoUploadDTO;
import com.nextcalendar.dto.photo.PhotoUploadResponseDTO;
import com.nextcalendar.entity.PhotoEntity;
import com.nextcalendar.entity.PhotoType;
import com.nextcalendar.service.PhotoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
public class PhotoController {

    private final PhotoService photoService;

    public PhotoController(PhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping(value = "/api/v1/appointments/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoResponseDTO uploadAppointmentPhoto(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", required = false, defaultValue = "OTHER") PhotoType type,
            @RequestParam(value = "caption", required = false) String caption) {
        return photoService.uploadAppointmentPhoto(id, file, type, caption);
    }

    @GetMapping("/api/v1/appointments/{id}/photos")
    public List<PhotoResponseDTO> getAppointmentPhotos(@PathVariable UUID id) {
        return photoService.findByAppointment(id);
    }

    @GetMapping("/api/v1/clients/{id}/photos")
    public List<PhotoResponseDTO> getClientPhotos(@PathVariable UUID id) {
        return photoService.findByClient(id);
    }

    @GetMapping("/api/v1/photos/{id}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable UUID id) {
        PhotoEntity photo = photoService.findById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .body(photo.getData());
    }

    @DeleteMapping("/api/v1/photos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(@PathVariable UUID id) {
        photoService.delete(id);
    }

    @PostMapping("/api/v1/photos")
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoUploadResponseDTO uploadLegacy(@Valid @RequestBody PhotoUploadDTO dto) {
        return photoService.upload(dto);
    }
}