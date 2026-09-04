package com.nextcalendar.controller.openapi;

import com.nextcalendar.dto.product.ProductCreateDTO;
import com.nextcalendar.dto.product.ProductMinResponseDTO;
import com.nextcalendar.dto.product.ProductUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Tag(name = "Produtos", description = "Endpoints para gerenciamento de produtos do estabelecimento")
public interface ProductApi {

    @Operation(summary = "Cadastrar produto", description = "Cadastra um novo produto vinculado a um estabelecimento.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Produto cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Regra de negócio violada"),
            @ApiResponse(responseCode = "404", description = "Estabelecimento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    ProductMinResponseDTO createProduct(ProductCreateDTO productDTO, UUID establishmentId);

    @Operation(summary = "Atualizar produto", description = "Atualiza os dados de um produto existente no estabelecimento.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Produto atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Produto ou estabelecimento não encontrado"),
            @ApiResponse(responseCode = "422", description = "Dados do formulário inválidos")
    })
    ProductMinResponseDTO updateProduct(UUID establishmentId, UUID idProduct, ProductUpdateDTO productDTO);

    @Operation(summary = "Buscar produtos por nome", description = "Realiza a busca paginada de produtos filtrando pelo nome.")
    @ApiResponse(responseCode = "200", description = "Busca realizada com sucesso")
    Page<ProductMinResponseDTO> findProductsByName(String name, UUID establishmentId, Pageable pageable);

    @Operation(summary = "Listar todos os produtos", description = "Retorna uma lista paginada com todos os produtos do estabelecimento.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    Page<ProductMinResponseDTO> findAllProducts(UUID establishmentId, Pageable pageable);

    @Operation(summary = "Inativar/Excluir produto", description = "Remove ou inativa um produto cadastrado.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Produto removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    })
    void deleteProduct(UUID id);
}
