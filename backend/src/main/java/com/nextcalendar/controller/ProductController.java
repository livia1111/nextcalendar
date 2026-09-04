package com.nextcalendar.controller;

import com.nextcalendar.controller.openapi.ProductApi;
import com.nextcalendar.dto.product.ProductCreateDTO;
import com.nextcalendar.dto.product.ProductMinResponseDTO;
import com.nextcalendar.dto.product.ProductUpdateDTO;
import com.nextcalendar.service.ProductService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/establishments/{establishmentId}/products")

public class ProductController implements ProductApi {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }


    @Override
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductMinResponseDTO createProduct(@Valid @RequestBody ProductCreateDTO productDTO, @PathVariable UUID establishmentId){
        return productService.createProduct(establishmentId, productDTO);
    }

    @Override
    @PutMapping("/{id}")
    public ProductMinResponseDTO updateProduct(@PathVariable UUID establishmentId, @PathVariable("id") UUID idProduct, @Valid @RequestBody ProductUpdateDTO productDTO){
        return productService.updateProduct(establishmentId, idProduct, productDTO);
    }

    @Override
    @GetMapping("/search")
    public Page<ProductMinResponseDTO> findProductsByName(@RequestParam (defaultValue = "") String name, @PathVariable UUID establishmentId, @ParameterObject Pageable pageable){
        return productService.findProductsByName(name, establishmentId, pageable);
    }

    @Override
    @GetMapping
    public Page<ProductMinResponseDTO> findAllProducts(@PathVariable UUID establishmentId, @ParameterObject Pageable pageable) {
        return productService.findAllProducts(establishmentId, pageable);
    }

    @Override
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable UUID id){productService.deleteProduct(id);}
}
