package com.nextcalendar.service;

import com.nextcalendar.dto.product.ProductCreateDTO;
import com.nextcalendar.dto.product.ProductMinResponseDTO;
import com.nextcalendar.dto.product.ProductUpdateDTO;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProductEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ProductMapper;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    private final EstablishmentRepository establishmentRepository;

    private final ProductMapper productMapper;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper, EstablishmentRepository establishmentRepository) {
        this.productRepository = productRepository;
        this.establishmentRepository = establishmentRepository;
        this.productMapper = productMapper;
    }

    private EstablishmentEntity findEstablishment(UUID establishmentId) {
        return establishmentRepository.findById(establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Estabelecimento", establishmentId));
    }

    @Transactional
    public ProductMinResponseDTO createProduct(UUID establishmentId, ProductCreateDTO productDTO){
        EstablishmentEntity establishment = findEstablishment(establishmentId);

        if(productRepository.existsByNameAndEstablishmentAndActiveTrue(productDTO.name(), establishment)){
            throw new BusinessException("Já existe um produto com o nome "+productDTO.name()+" neste estabelecimento.");
        }

        ProductEntity inactiveProduct = productRepository
                .findByNameAndEstablishmentAndActiveFalse(productDTO.name(), establishment)
                .orElse(null);

        if (inactiveProduct != null) {
            productMapper.updateEntity(inactiveProduct, productDTO);
            inactiveProduct.setActive(true);

            ProductEntity reactivatedProduct = productRepository.save(inactiveProduct);

            return new ProductMinResponseDTO(reactivatedProduct);
        }

        ProductEntity product = productMapper.toEntity(productDTO, establishment);
        ProductEntity savedProduct = productRepository.save(product);

        return new ProductMinResponseDTO(savedProduct);
    }

    @Transactional
    public ProductMinResponseDTO updateProduct(UUID establishmentId, UUID idProduct, ProductUpdateDTO productDTO){
        EstablishmentEntity establishment = findEstablishment(establishmentId);

        ProductEntity productEntity = productRepository.findByIdAndEstablishmentAndActiveTrue(idProduct, establishment)
                .orElseThrow(()->new EntityNotFoundException("Produto", idProduct));

        if(productRepository.existsByNameAndEstablishmentAndActiveTrueAndIdNot(productDTO.name(), establishment, idProduct)){
            throw new BusinessException("Já existe um produto com esse nome neste estabelecimento.");
        }

        productMapper.updateEntity(productEntity, productDTO);

        ProductEntity updatedProduct = productRepository.save(productEntity);

        return new ProductMinResponseDTO(updatedProduct);
    }

    @Transactional(readOnly = true)
    public Page<ProductMinResponseDTO> findProductsByName(String searchName, UUID establishmentId, Pageable pageable){

        EstablishmentEntity establishment = findEstablishment(establishmentId);

        return productRepository.findByEstablishmentAndNameContainingIgnoreCaseAndActiveTrue(establishment, searchName, pageable)
                .map(ProductMinResponseDTO::new);
    }


    @Transactional(readOnly = true)
    public Page<ProductMinResponseDTO> findAllProducts(UUID establishmentId, Pageable pageable){

        EstablishmentEntity establishment = findEstablishment(establishmentId);

        return productRepository.findByEstablishmentAndActiveTrue(establishment, pageable)
                .map(ProductMinResponseDTO::new);
    }


    @Transactional
    public void deleteProduct(UUID id){
        ProductEntity product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(()->new EntityNotFoundException("Produto", id));

        product.setActive(false);
        productRepository.save(product);
    }
}
