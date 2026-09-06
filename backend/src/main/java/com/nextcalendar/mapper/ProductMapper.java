package com.nextcalendar.mapper;

import com.nextcalendar.dto.product.ProductCreateDTO;
import com.nextcalendar.dto.product.ProductUpdateDTO;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProductEntity;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ProductMapper {
    public ProductEntity toEntity(ProductCreateDTO dto, EstablishmentEntity establishment) {
        ProductEntity product = new ProductEntity();

        product.setName(dto.name());
        product.setCategory(dto.category());
        product.setPrice(dto.price());
        product.setStockQuantity(dto.stockQuantity());
        product.setEstablishment(establishment);
        product.setActive(true);

        return product;
    }

    public void updateEntity(ProductEntity product, ProductUpdateDTO dto) {
        Optional.ofNullable(dto.name())
                .filter(name -> !name.isBlank())
                .ifPresent(product::setName);

        Optional.ofNullable(dto.category())
                .filter(category -> !category.isBlank())
                .ifPresent(product::setCategory);

        Optional.ofNullable(dto.price())
                .ifPresent(product::setPrice);

        Optional.ofNullable(dto.stockQuantity())
                .ifPresent(product::setStockQuantity);
    }

    public void updateEntity(ProductEntity product, ProductCreateDTO dto) {
        product.setName(dto.name());
        product.setCategory(dto.category());
        product.setPrice(dto.price());
        product.setStockQuantity(dto.stockQuantity());
    }
}
