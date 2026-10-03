package com.nextcalendar.service;

import com.nextcalendar.dto.photo.PhotoUploadDTO;
import com.nextcalendar.dto.photo.PhotoUploadResponseDTO;
import com.nextcalendar.entity.PhotoEntity;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.repository.PhotoRepository;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.UUID;

@Service
public class PhotoService {

    private final PhotoRepository photoRepository;

    public PhotoService(PhotoRepository photoRepository) {this.photoRepository = photoRepository;}

    public PhotoUploadResponseDTO upload(PhotoUploadDTO dto) {
        byte[] bytes = Base64.getDecoder().decode(dto.content());

        PhotoEntity photo = new PhotoEntity();
        photo.setData(bytes);
        photo.setContentType(dto.contentType());

        PhotoEntity saved = photoRepository.save(photo);

        String url = "/api/v1/photos/" + saved.getId();
        return new PhotoUploadResponseDTO(saved.getId(), url);
    }

    public PhotoEntity findById(UUID id) {
        return photoRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Foto", id));
    }
}
