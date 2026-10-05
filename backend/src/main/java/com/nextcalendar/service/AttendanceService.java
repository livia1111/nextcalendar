package com.nextcalendar.service;

import com.nextcalendar.config.SecurityUtils;
import com.nextcalendar.dto.attendance.AttendanceResponseDTO;
import com.nextcalendar.entity.*;
import com.nextcalendar.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AttendanceService {

    private final AppointmentRepository appointmentRepository;
    private final ProfessionalRepository professionalRepository;
    private final EstablishmentRepository establishmentRepository;
    private final OrderRepository orderRepository;
    private final PhotoRepository photoRepository;
    private final TechnicalSheetEntryRepository technicalSheetEntryRepository;

    public AttendanceService(AppointmentRepository appointmentRepository,
                             ProfessionalRepository professionalRepository,
                             EstablishmentRepository establishmentRepository,
                             OrderRepository orderRepository,
                             PhotoRepository photoRepository,
                             TechnicalSheetEntryRepository technicalSheetEntryRepository) {
        this.appointmentRepository = appointmentRepository;
        this.professionalRepository = professionalRepository;
        this.establishmentRepository = establishmentRepository;
        this.orderRepository = orderRepository;
        this.photoRepository = photoRepository;
        this.technicalSheetEntryRepository = technicalSheetEntryRepository;
    }

    private AttendanceResponseDTO toDTO(AppointmentEntity a) {
        Optional<OrderEntity> orderOpt = orderRepository.findByAppointmentId(a.getId());
        UUID orderId = orderOpt.map(OrderEntity::getId).orElse(null);
        OrderStatus orderStatus = orderOpt.map(OrderEntity::getStatus).orElse(null);

        BigDecimal totalAmount;
        List<String> services;

        if (orderOpt.isPresent()) {
            OrderEntity order = orderOpt.get();
            if (order.getClosedTotalAmount() != null) {
                totalAmount = order.getClosedTotalAmount();
            } else {
                BigDecimal subtotal = order.getItems().stream()
                        .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                totalAmount = subtotal.subtract(order.getDiscountAmount()).max(BigDecimal.ZERO);
            }
            List<String> orderServices = order.getItems().stream()
                    .filter(i -> i.getItemType() == OrderItemType.SERVICE)
                    .map(OrderItemEntity::getName)
                    .toList();
            services = orderServices.isEmpty() ? List.of(a.getService().getName()) : orderServices;
        } else {
            totalAmount = a.getService().getPrice();
            services = List.of(a.getService().getName());
        }

        int photosCount = (int) photoRepository.countByAppointmentId(a.getId());
        boolean hasTechnicalSheet = technicalSheetEntryRepository.existsByAppointmentId(a.getId());

        String clientName = a.getClient() != null ? a.getClient().getName() : a.getClientNameFallback();
        String clientPhone = a.getClient() != null ? a.getClient().getPhone() : a.getClientPhoneFallback();
        UUID clientId = a.getClient() != null ? a.getClient().getId() : null;

        return new AttendanceResponseDTO(
                a.getId(),
                a.getEstablishment().getId(),
                a.getProfessional().getId(),
                a.getProfessional().getName(),
                clientId,
                clientName,
                clientPhone,
                a.getService().getId(),
                a.getService().getName(),
                services,
                a.getStartDateTime(),
                a.getEndDateTime(),
                a.getStatus(),
                orderId,
                orderStatus,
                totalAmount,
                photosCount,
                hasTechnicalSheet,
                a.getNotes()
        );
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponseDTO> getProfessionalAttendances(
            AppointmentStatus status,
            LocalDateTime from,
            LocalDateTime to,
            UUID clientId,
            Pageable pageable) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm acesso aos atendimentos.");
        }
        ProfessionalEntity prof = professionalRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));

        return appointmentRepository.findAttendancesByProfessional(
                prof.getId(), status, clientId, from, to, pageable
        ).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponseDTO> getEstablishmentAttendances(
            UUID professionalId,
            UUID clientId,
            AppointmentStatus status,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm acesso aos atendimentos.");
        }
        if (currentUser.getRole() == UserRole.PROFESSIONAL) {
            throw new AccessDeniedException("Profissionais devem acessar seus atendimentos em /professionals/me/attendances.");
        }

        UUID estId = establishmentRepository.findFirstByOwnerIdAndActiveTrue(currentUser.getId())
                .map(EstablishmentEntity::getId)
                .orElseGet(() -> establishmentRepository.findAll().stream().findFirst()
                        .map(EstablishmentEntity::getId)
                        .orElseThrow(() -> new AccessDeniedException("Estabelecimento do gestor não localizado.")));

        return appointmentRepository.findAttendancesByEstablishment(
                estId, professionalId, status, clientId, from, to, pageable
        ).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getClientAttendances(UUID clientId) {
        UserEntity currentUser = SecurityUtils.getRequiredAuthenticatedUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Clientes não têm acesso aos atendimentos.");
        }

        if (currentUser.getRole() == UserRole.PROFESSIONAL) {
            ProfessionalEntity prof = professionalRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("Perfil de profissional não localizado."));
            return appointmentRepository.findAttendancesByClientAndProfessional(clientId, prof.getId())
                    .stream()
                    .map(this::toDTO)
                    .toList();
        } else {
            UUID estId = establishmentRepository.findFirstByOwnerIdAndActiveTrue(currentUser.getId())
                    .map(EstablishmentEntity::getId)
                    .orElseGet(() -> establishmentRepository.findAll().stream().findFirst()
                            .map(EstablishmentEntity::getId)
                            .orElseThrow(() -> new AccessDeniedException("Estabelecimento do gestor não localizado.")));

            return appointmentRepository.findAttendancesByClientAndEstablishment(clientId, estId)
                    .stream()
                    .map(this::toDTO)
                    .toList();
        }
    }
}
