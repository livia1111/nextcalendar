package com.nextcalendar.service;

import com.nextcalendar.dto.services.ServiceCreateDTO;
import com.nextcalendar.dto.services.ServiceMinResponseDTO;
import com.nextcalendar.dto.services.ServiceUpdateDTO;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ServiceEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ServiceMapper;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.ServiceRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ServiceService {
    private final ServiceRepository serviceRepository;

    private final EstablishmentRepository establishmentRepository;

    private final ServiceMapper serviceMapper;

    public ServiceService(ServiceRepository serviceRepository, ServiceMapper serviceMapper,EstablishmentRepository establishmentRepository) {
        this.serviceRepository = serviceRepository;
        this.establishmentRepository = establishmentRepository;
        this.serviceMapper = serviceMapper;
    }

    private EstablishmentEntity findEstablishment(UUID establishmentId) {
        return establishmentRepository.findById(establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Estabelecimento", establishmentId));
    }

    @Transactional
    public ServiceMinResponseDTO createService(UUID establishmentId, ServiceCreateDTO serviceDTO){
        EstablishmentEntity establishment = findEstablishment(establishmentId);

        if(serviceRepository.existsByNameAndEstablishmentAndActiveTrue(serviceDTO.name(),establishment)){
            throw new BusinessException("Já existe um serviço com o nome "+serviceDTO.name()+" neste estabelecimento.");
        }

        ServiceEntity inactiveService = serviceRepository
                .findByNameAndEstablishmentAndActiveFalse(serviceDTO.name(), establishment)
                .orElse(null);

        if (inactiveService != null) {
            serviceMapper.updateEntity(inactiveService, serviceDTO);
            inactiveService.setActive(true);

            ServiceEntity reactivatedService = serviceRepository.save(inactiveService);

            return new ServiceMinResponseDTO(reactivatedService);
        }


        ServiceEntity service = serviceMapper.toEntity(serviceDTO,establishment);
        ServiceEntity savedService = serviceRepository.save(service);

        return new ServiceMinResponseDTO(savedService);
    }

    @Transactional
    public ServiceMinResponseDTO updateService(UUID establishmentId, UUID idService, ServiceUpdateDTO serviceDTO){
        EstablishmentEntity establishment = findEstablishment(establishmentId);

        ServiceEntity serviceEntity = serviceRepository.findByIdAndEstablishmentAndActiveTrue(idService,establishment)
                .orElseThrow(()->new EntityNotFoundException("Servico",idService));

        if(serviceRepository.existsByNameAndEstablishmentAndActiveTrueAndIdNot(serviceDTO.name(),establishment,idService)){
            throw new BusinessException( "Já existe um serviço com esse nome neste estabelecimento.");
        }

        serviceMapper.updateEntity(serviceEntity, serviceDTO);

        ServiceEntity updatedService = serviceRepository.save(serviceEntity);

        return new ServiceMinResponseDTO(updatedService);
    }

    @Transactional(readOnly = true)
    public Page<ServiceMinResponseDTO> findServicesByName(String searchName, UUID establishmentId, Pageable pageable){

        EstablishmentEntity establishment = findEstablishment(establishmentId);

        return serviceRepository.findByEstablishmentAndNameContainingIgnoreCaseAndActiveTrue(establishment,searchName,pageable)
                .map(ServiceMinResponseDTO::new);
    }


    @Transactional(readOnly = true)
    public  Page<ServiceMinResponseDTO> findAllServices(UUID establishmentId, Pageable pageable){

        EstablishmentEntity establishment = findEstablishment(establishmentId);

        return serviceRepository.findByEstablishmentAndActiveTrue(establishment,pageable)
                .map(ServiceMinResponseDTO::new);
    }


    @Transactional
    public void deleteService(UUID id){
        ServiceEntity service = serviceRepository.findByIdAndActiveTrue(id)
                .orElseThrow(()->new EntityNotFoundException("Serviço",id));

        service.setActive(false);
        serviceRepository.save(service);
    }
    
}

