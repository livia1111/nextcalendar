package com.nextcalendar.mapper;

import com.nextcalendar.dto.appointment.AppointmentCreateDTO;
import com.nextcalendar.dto.appointment.AppointmentResponseDTO;
import com.nextcalendar.entity.*;
import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {

    public AppointmentEntity toEntity(AppointmentCreateDTO dto,
                                      ProfessionalEntity professional,
                                      ServiceEntity service,
                                      ClientEntity client) {

        AppointmentEntity appointment = new AppointmentEntity();

        appointment.setEstablishment(professional.getEstablishment());
        appointment.setProfessional(professional);
        appointment.setService(service);
        appointment.setClient(client);
        appointment.setNotes(dto.notes());
        appointment.setClientNameFallback(dto.clientNameFallback());
        appointment.setClientPhoneFallback(dto.clientPhoneFallback());

        return appointment;
    }

    public AppointmentResponseDTO toResponseDTO(AppointmentEntity ppointment) {
        return new AppointmentResponseDTO(
                ppointment.getId(),
                ppointment.getProfessional().getId(),
                ppointment.getProfessional().getName(),
                ppointment.getService().getId(),
                ppointment.getService().getName(),
                ppointment.getService().getPrice(),
                ppointment.getClient() != null ? ppointment.getClient().getId() : null,
                ppointment.getClient() != null ? ppointment.getClient().getName() : ppointment.getClientNameFallback(),
                ppointment.getStartDateTime(),
                ppointment.getEndDateTime(),
                ppointment.getStatus(),
                ppointment.isFitIn(),
                ppointment.getNotes()
        );
    }
}
