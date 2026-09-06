package com.nextcalendar.mapper;

import com.nextcalendar.dto.services.ServiceCreateDTO;
import com.nextcalendar.dto.services.ServiceUpdateDTO;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ServiceEntity;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ServiceMapper {

    public ServiceEntity toEntity(ServiceCreateDTO dto, EstablishmentEntity establishment) {
        ServiceEntity service = new ServiceEntity();

        service.setName(dto.name());
        service.setPrice(dto.price());
        service.setDuration(dto.duration());
        service.setCategory(dto.category());
        service.setEstablishment(establishment);
        service.setActive(true);

        return service;
    }

    public void updateEntity(ServiceEntity service, ServiceUpdateDTO dto) {
        Optional.ofNullable(dto.name())
                .filter(name -> !name.isBlank())
                .ifPresent(service::setName);

        Optional.ofNullable(dto.price())
                .ifPresent(service::setPrice);

        Optional.ofNullable(dto.duration())
                .ifPresent(service::setDuration);

        Optional.ofNullable(dto.category())
                .filter(category -> !category.isBlank())
                .ifPresent(service::setCategory);
    }

    public void updateEntity(ServiceEntity service, ServiceCreateDTO dto) {
        service.setName(dto.name());
        service.setPrice(dto.price());
        service.setDuration(dto.duration());
        service.setCategory(dto.category());
    }
}
