package com.nextcalendar.controller;

import com.nextcalendar.controller.openapi.EstablishmentApi;
import com.nextcalendar.dto.*;
import com.nextcalendar.dto.establishment.EstablishmentCreateDTO;
import com.nextcalendar.dto.establishment.EstablishmentResponseDTO;
import com.nextcalendar.dto.establishment.EstablishmentUpdateDTO;
import com.nextcalendar.service.EstablishmentService;
import com.nextcalendar.service.ViaCepService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class EstablishmentController implements EstablishmentApi {

    private final EstablishmentService establishmentService;
    private final ViaCepService viaCepService;

    public EstablishmentController(EstablishmentService establishmentService, ViaCepService viaCepService) {
        this.establishmentService = establishmentService;
        this.viaCepService = viaCepService;
    }

    // ------------------------------------------------------------------ Establishment CRUD

    /**
     * UC01 — POST /api/v1/establishments
     * Cria o estabelecimento com trial (30 dias) + Profile GESTOR automaticamente.
     */
    @Override
    @PostMapping("/establishments")
    @ResponseStatus(HttpStatus.CREATED)
    public EstablishmentResponseDTO create(@Valid @RequestBody EstablishmentCreateDTO dto) {
        return establishmentService.createEstablishment(dto);
    }

    /**
     * GET /api/v1/establishments/{id}
     * Retorna os dados do estabelecimento — usado ao abrir a tela Empresa.
     */
    @Override
    @GetMapping("/establishments/{id}")
    public EstablishmentResponseDTO findById(@PathVariable UUID id) {
        return establishmentService.findById(id);
    }

    /**
     * PUT /api/v1/establishments/{id}
     * Atualização parcial — botão "Salvar" da tela Empresa.
     * UC06: dados inválidos retornam 422.
     */
    @Override
    @PutMapping("/establishments/{id}")
    public EstablishmentResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody EstablishmentUpdateDTO dto
    ) {
        return establishmentService.update(id, dto);
    }

    /**
     * DELETE /api/v1/establishments/{id}
     * Soft delete — desativa o estabelecimento (não remove do banco).
     */
    @Override
    @DeleteMapping("/establishments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        establishmentService.delete(id);
    }

    // ------------------------------------------------------------------ UC03

    /**
     * UC03 — GET /api/v1/establishments/owner/{ownerId}
     * Busca o establishment vinculado ao usuário autenticado.
     * Fluxo alternativo 1a: 404 se não encontrado.
     */
    @Override
    @GetMapping("/establishments/owner/{ownerId}")
    public EstablishmentResponseDTO findByOwner(@PathVariable UUID ownerId) {
        return establishmentService.findByOwnerId(ownerId);
    }

    // ------------------------------------------------------------------ UC04

    /**
     * UC04 — PATCH /api/v1/establishments/{id}/terms
     * Registra aceite dos termos de uso e retorna dados atualizados.
     * Fluxo alternativo 2a: não chamar este endpoint = termsAccepted permanece false.
     */
    @Override
    @PatchMapping("/establishments/{id}/terms")
    public EstablishmentResponseDTO acceptTerms(@PathVariable UUID id) {
        return establishmentService.acceptTerms(id);
    }

    // ------------------------------------------------------------------ UC05

    /**
     * UC05 — GET /api/v1/establishments/{id}/trial
     * Retorna status do trial: dias restantes, aviso (<= 7 dias) e se está expirado.
     */
    @Override
    @GetMapping("/establishments/{id}/trial")
    public TrialStatusDTO getTrialStatus(@PathVariable UUID id) {
        return establishmentService.getTrialStatus(id);
    }

    // ------------------------------------------------------------------ ViaCEP

    /**
     * GET /api/v1/cep/{cep}
     * Consulta a API do ViaCEP para preenchimento automático de endereço.
     * UC01 6a: CEP inválido → 422. UC01 6b: API indisponível → 503.
     */
    @Override
    @GetMapping("/cep/{cep}")
    public ViaCepResponseDTO consultarCep(@PathVariable String cep) {
        return viaCepService.consultar(cep);
    }
}
