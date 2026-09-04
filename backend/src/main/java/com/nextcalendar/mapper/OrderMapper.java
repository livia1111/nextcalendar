package com.nextcalendar.mapper;

import com.nextcalendar.entity.AppointmentEntity;
import com.nextcalendar.entity.OrderEntity;
import com.nextcalendar.entity.OrderItemEntity;
import com.nextcalendar.entity.OrderItemType;
import com.nextcalendar.entity.OrderStatus;
import com.nextcalendar.entity.ProductEntity;
import com.nextcalendar.entity.ServiceEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class OrderMapper {

    public OrderEntity toEntity(AppointmentEntity appointment) {
        OrderEntity order = new OrderEntity();
        order.setEstablishment(appointment.getEstablishment());
        order.setAppointment(appointment);
        order.setStatus(OrderStatus.OPEN);
        order.setDiscountAmount(BigDecimal.ZERO);
        return order;
    }

    public OrderItemEntity fromService(OrderEntity order, ServiceEntity service, Integer quantity) {
        OrderItemEntity item = new OrderItemEntity();
        item.setOrder(order);
        item.setItemType(OrderItemType.SERVICE);
        item.setService(service);
        item.setName(service.getName());
        item.setUnitPrice(service.getPrice());
        item.setQuantity(quantity != null ? quantity : 1);
        return item;
    }

    public OrderItemEntity fromProduct(OrderEntity order, ProductEntity product, Integer quantity) {
        OrderItemEntity item = new OrderItemEntity();
        item.setOrder(order);
        item.setItemType(OrderItemType.PRODUCT);
        item.setProduct(product);
        item.setName(product.getName());
        item.setUnitPrice(product.getPrice());
        item.setQuantity(quantity != null ? quantity : 1);
        return item;
    }
}
