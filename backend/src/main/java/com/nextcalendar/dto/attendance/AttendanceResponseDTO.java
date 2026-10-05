package com.nextcalendar.dto.attendance;

import com.nextcalendar.entity.AppointmentStatus;
import com.nextcalendar.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AttendanceResponseDTO(
        UUID id,
        UUID establishmentId,
        UUID professionalId,
        String professionalName,
        UUID clientId,
        String clientName,
        String clientPhone,
        UUID serviceId,
        String serviceName,
        List<String> services,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        AppointmentStatus status,
        UUID orderId,
        OrderStatus orderStatus,
        BigDecimal totalAmount,
        int photosCount,
        boolean hasTechnicalSheet,
        String notes
) {}
