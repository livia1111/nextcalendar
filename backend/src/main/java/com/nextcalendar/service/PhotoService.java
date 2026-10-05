package com.nextcalendar.service;

import com.nextcalendar.config.SecurityUtils;
import com.nextcalendar.dto.photo.PhotoResponseDTO;
import com.nextcalendar.dto.photo.PhotoUploadDTO;
import com.nextcalendar.dto.photo.PhotoUploadResponseDTO;
import com.nextcalendar.entity.*;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.repository.AppointmentRepository;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.OrderRepository;
import com.nextcalendar.repository.PhotoRepository;
import com.nextcalendar.repository.ProfessionalRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final AppointmentRepository appointmentRepository;
    private final ProfessionalRepository professionalRepository;
    private final EstablishmentRepository establishmentRepository;
    private final OrderRepository orderRepository;

    public PhotoService(PhotoRepository photoRepository,
                        AppointmentRepository appointmentRepository,
                        ProfessionalRepository professionalRepository,
                        EstablishmentRepository establishmentRepository,
                        OrderRepository orderRepository) {
        this.photoRepository = photoRepository;
        this.appointmentRepository = appointmentRepository;
        this.professionalRepository = professionalRepository;
        this.establishmentRepository = establishmentRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public PhotoResponseDTO uploadAppointmentPhoto(UUID appointmentId, MultipartFile file, PhotoType type, String caption) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm permissão para fazer upload de fotos.");
        }

        AppointmentEntity appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Agendamento", appointmentId));

        if (currentUser.getRole() == UserRole.PROFESSIONAL) {
            ProfessionalEntity prof = professionalRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
            if (!appointment.getProfessional().getId().equals(prof.getId())) {
                throw new AccessDeniedException("Profissionais só podem adicionar fotos aos seus próprios agendamentos.");
            }
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            Optional<EstablishmentEntity> managerEst = establishmentRepository.findFirstByOwnerIdAndActiveTrue(currentUser.getId());
            if (managerEst.isPresent() && !appointment.getEstablishment().getId().equals(managerEst.get().getId())) {
                throw new AccessDeniedException("Acesso negado para agendamentos de outro estabelecimento.");
            }
        }

        boolean isOrderOpen = orderRepository.findByAppointmentId(appointment.getId())
                .map(o -> o.getStatus() == OrderStatus.OPEN)
                .orElse(false);

        boolean isAllowedStatus = appointment.getStatus() == AppointmentStatus.IN_PROGRESS
                || appointment.getStatus() == AppointmentStatus.DONE
                || isOrderOpen;

        if (!isAllowedStatus) {
            throw new BusinessException("Upload de foto só é permitido para agendamentos em andamento ou concluídos.");
        }

        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo de foto não informado.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BusinessException("O arquivo de foto excede o limite máximo de 5MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg")
                && !contentType.equalsIgnoreCase("image/jpg")
                && !contentType.equalsIgnoreCase("image/png")
                && !contentType.equalsIgnoreCase("image/webp"))) {
            throw new BusinessException("Formato de imagem inválido. Formatos permitidos: JPEG, PNG e WEBP.");
        }

        PhotoEntity photo = new PhotoEntity();
        photo.setAppointment(appointment);
        photo.setClient(appointment.getClient());
        photo.setType(type != null ? type : PhotoType.OTHER);
        photo.setTakenBy(currentUser);
        photo.setCaption(caption != null ? caption.trim() : null);
        photo.setContentType(contentType);

        try {
            photo.setData(file.getBytes());
        } catch (IOException e) {
            throw new BusinessException("Falha ao ler os bytes da imagem.");
        }

        PhotoEntity saved = photoRepository.save(photo);
        return new PhotoResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<PhotoResponseDTO> findByAppointment(UUID appointmentId) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm permissão para acessar fotos.");
        }

        AppointmentEntity appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Agendamento", appointmentId));

        if (currentUser.getRole() == UserRole.PROFESSIONAL) {
            ProfessionalEntity prof = professionalRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
            if (!appointment.getProfessional().getId().equals(prof.getId())) {
                throw new AccessDeniedException("Profissionais só podem visualizar fotos dos seus próprios agendamentos.");
            }
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            Optional<EstablishmentEntity> managerEst = establishmentRepository.findFirstByOwnerIdAndActiveTrue(currentUser.getId());
            if (managerEst.isPresent() && !appointment.getEstablishment().getId().equals(managerEst.get().getId())) {
                throw new AccessDeniedException("Acesso negado para fotos de outro estabelecimento.");
            }
        }

        return photoRepository.findByAppointmentIdOrderByCreatedAtAsc(appointmentId)
                .stream()
                .map(PhotoResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PhotoResponseDTO> findByClient(UUID clientId) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm permissão para acessar fotos.");
        }

        if (currentUser.getRole() == UserRole.PROFESSIONAL) {
            ProfessionalEntity prof = professionalRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
            return photoRepository.findByClientIdAndProfessionalId(clientId, prof.getId())
                    .stream()
                    .map(PhotoResponseDTO::new)
                    .toList();
        } else if (currentUser.getRole() == UserRole.MANAGER) {
            Optional<EstablishmentEntity> managerEst = establishmentRepository.findFirstByOwnerIdAndActiveTrue(currentUser.getId());
            if (managerEst.isPresent()) {
                return photoRepository.findByClientIdAndEstablishmentId(clientId, managerEst.get().getId())
                        .stream()
                        .map(PhotoResponseDTO::new)
                        .toList();
            }
        }

        return photoRepository.findByClientIdOrderByCreatedAtDesc(clientId)
                .stream()
                .map(PhotoResponseDTO::new)
                .toList();
    }

    public PhotoEntity findById(UUID id) {
        return photoRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Foto", id));
    }

    @Transactional
    public void delete(UUID id) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm permissão para excluir fotos.");
        }

        PhotoEntity photo = findById(id);

        if (photo.getAppointment() != null) {
            if (currentUser.getRole() == UserRole.PROFESSIONAL) {
                ProfessionalEntity prof = professionalRepository.findByUserId(currentUser.getId())
                        .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
                if (!photo.getAppointment().getProfessional().getId().equals(prof.getId())) {
                    throw new AccessDeniedException("Profissionais só podem excluir fotos dos seus próprios agendamentos.");
                }
            } else if (currentUser.getRole() == UserRole.MANAGER) {
                Optional<EstablishmentEntity> managerEst = establishmentRepository.findFirstByOwnerIdAndActiveTrue(currentUser.getId());
                if (managerEst.isPresent() && !photo.getAppointment().getEstablishment().getId().equals(managerEst.get().getId())) {
                    throw new AccessDeniedException("Acesso negado para fotos de outro estabelecimento.");
                }
            }
        }

        photoRepository.delete(photo);
    }

    public PhotoUploadResponseDTO upload(PhotoUploadDTO dto) {
        byte[] bytes = Base64.getDecoder().decode(dto.content());

        PhotoEntity photo = new PhotoEntity();
        photo.setData(bytes);
        photo.setContentType(dto.contentType());

        PhotoEntity saved = photoRepository.save(photo);

        String url = "/api/v1/photos/" + saved.getId();
        return new PhotoUploadResponseDTO(saved.getId(), url);
    }
}
