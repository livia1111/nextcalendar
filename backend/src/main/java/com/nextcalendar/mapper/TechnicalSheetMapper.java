package com.nextcalendar.mapper;

import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.ClientEntity;
import com.nextcalendar.entity.TechnicalSheetEntity;
import com.nextcalendar.entity.TechnicalSheetEntryEntity;
import com.nextcalendar.entity.TechnicalSheetPhotoEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class TechnicalSheetMapper {

    public TechnicalSheetEntity toEntity(ClientEntity client) {
        TechnicalSheetEntity sheet = new TechnicalSheetEntity();
        sheet.setClient(client);
        return sheet;
    }

    public TechnicalSheetEntryEntity toEntryEntity(
            TechnicalSheetEntity sheet,
            AppointmentEntity appointment,
            String notes,
            List<String> photoUrls
    ) {
        TechnicalSheetEntryEntity entry = new TechnicalSheetEntryEntity();
        entry.setTechnicalSheet(sheet);
        entry.setAppointment(appointment);
        entry.setProfessional(appointment.getProfessional());
        entry.setNotes(notes);
        entry.setCreatedAt(LocalDateTime.now());

        if (photoUrls != null) {
            for (String url : photoUrls) {
                TechnicalSheetPhotoEntity photo = new TechnicalSheetPhotoEntity();
                photo.setEntry(entry);
                photo.setPhotoUrl(url);
                photo.setCreatedAt(LocalDateTime.now());
                entry.getPhotos().add(photo);
            }
        }

        return entry;
    }
}