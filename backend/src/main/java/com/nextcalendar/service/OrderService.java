package com.nextcalendar.service;

import com.nextcalendar.dto.order.OrderItemAddDTO;
import com.nextcalendar.dto.order.OrderResponseDTO;
import com.nextcalendar.dto.order.OrderUpdateDTO;
import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.AppointmentStatus;
import com.nextcalendar.entity.OrderEntity;
import com.nextcalendar.entity.OrderItemEntity;
import com.nextcalendar.entity.OrderItemType;
import com.nextcalendar.entity.OrderStatus;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProductEntity;
import com.nextcalendar.entity.ServiceEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.OrderMapper;
import com.nextcalendar.repository.AppointmentRepository;
import com.nextcalendar.repository.OrderRepository;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.ProductRepository;
import com.nextcalendar.repository.ServiceRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final AppointmentRepository appointmentRepository;
    private final EstablishmentRepository establishmentRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;

    public OrderService(OrderRepository orderRepository,
                        AppointmentRepository appointmentRepository,
                        EstablishmentRepository establishmentRepository,
                        ServiceRepository serviceRepository,
                        ProductRepository productRepository,
                        OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.appointmentRepository = appointmentRepository;
        this.establishmentRepository = establishmentRepository;
        this.serviceRepository = serviceRepository;
        this.productRepository = productRepository;
        this.orderMapper = orderMapper;
    }

    private EstablishmentEntity findEstablishment(UUID establishmentId) {
        return establishmentRepository.findById(establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Estabelecimento", establishmentId));
    }

    private AppointmentEntity findAppointment(UUID establishmentId, UUID appointmentId) {
        AppointmentEntity appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Agendamento", appointmentId));

        if (!appointment.getEstablishment().getId().equals(establishmentId)) {
            throw new EntityNotFoundException("Agendamento", appointmentId);
        }
        return appointment;
    }

    private OrderEntity findOrder(UUID establishmentId, UUID orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Comanda", orderId));

        if (!order.getEstablishment().getId().equals(establishmentId)) {
            throw new EntityNotFoundException("Comanda", orderId);
        }
        return order;
    }

    private void validateOpen(OrderEntity order) {
        if (order.getStatus() == OrderStatus.CLOSED) {
            throw new BusinessException("Esta comanda já foi finalizada e não pode mais ser alterada.");
        }
    }

    private BigDecimal calculateTotal(OrderEntity order) {
        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = subtotal.subtract(order.getDiscountAmount());
        return total.max(BigDecimal.ZERO);
    }

    @Transactional
    public OrderResponseDTO openOrder(UUID establishmentId, UUID appointmentId) {
        AppointmentEntity appointment = findAppointment(establishmentId, appointmentId);

        Optional<OrderEntity> existente = orderRepository.findByAppointmentId(appointmentId);
        if (existente.isPresent()) {
            return new OrderResponseDTO(existente.get());
        }

        OrderEntity order = orderMapper.toEntity(appointment);

        OrderItemEntity itemInicial = orderMapper.fromService(order, appointment.getService(), 1);
        order.getItems().add(itemInicial);

        OrderEntity savedOrder = orderRepository.save(order);
        return new OrderResponseDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO findById(UUID establishmentId, UUID orderId) {
        return new OrderResponseDTO(findOrder(establishmentId, orderId));
    }

    @Transactional
    public OrderResponseDTO addItem(UUID establishmentId, UUID orderId, OrderItemAddDTO dto) {
        OrderEntity order = findOrder(establishmentId, orderId);
        validateOpen(order);

        OrderItemEntity item;

        if (dto.itemType() == OrderItemType.SERVICE) {
            ServiceEntity service = serviceRepository.findByIdAndEstablishmentAndActiveTrue(dto.itemId(), order.getEstablishment())
                    .orElseThrow(() -> new EntityNotFoundException("Serviço", dto.itemId()));
            item = orderMapper.fromService(order, service, dto.quantity());
        } else {
            ProductEntity product = productRepository.findByIdAndEstablishmentAndActiveTrue(dto.itemId(), order.getEstablishment())
                    .orElseThrow(() -> new EntityNotFoundException("Produto", dto.itemId()));
            item = orderMapper.fromProduct(order, product, dto.quantity());
        }

        order.getItems().add(item);

        OrderEntity savedOrder = orderRepository.save(order);
        return new OrderResponseDTO(savedOrder);
    }

    @Transactional
    public OrderResponseDTO removeItem(UUID establishmentId, UUID orderId, UUID itemId) {
        OrderEntity order = findOrder(establishmentId, orderId);
        validateOpen(order);

        boolean removido = order.getItems().removeIf(item -> item.getId().equals(itemId));
        if (!removido) {
            throw new EntityNotFoundException("Item da comanda", itemId);
        }

        OrderEntity savedOrder = orderRepository.save(order);
        return new OrderResponseDTO(savedOrder);
    }

    @Transactional
    public OrderResponseDTO update(UUID establishmentId, UUID orderId, OrderUpdateDTO dto) {
        OrderEntity order = findOrder(establishmentId, orderId);
        validateOpen(order);

        Optional.ofNullable(dto.discountAmount()).ifPresent(order::setDiscountAmount);
        Optional.ofNullable(dto.paymentMethod()).ifPresent(order::setPaymentMethod);

        OrderEntity savedOrder = orderRepository.save(order);
        return new OrderResponseDTO(savedOrder);
    }

    @Transactional
    public OrderResponseDTO finish(UUID establishmentId, UUID orderId) {
        OrderEntity order = findOrder(establishmentId, orderId);
        validateOpen(order);

        if (order.getItems().isEmpty()) {
            throw new BusinessException("A comanda precisa ter ao menos um item para ser finalizada.");
        }

        if (order.getPaymentMethod() == null) {
            throw new BusinessException("Selecione a forma de pagamento antes de finalizar a comanda.");
        }

        order.setClosedTotalAmount(calculateTotal(order));
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(LocalDateTime.now());

        AppointmentEntity appointment = order.getAppointment();
        appointment.setStatus(AppointmentStatus.DONE);
        appointmentRepository.save(appointment);

        OrderEntity savedOrder = orderRepository.save(order);
        return new OrderResponseDTO(savedOrder);
    }
}
