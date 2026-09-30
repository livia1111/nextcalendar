package com.nextcalendar.service;

import com.nextcalendar.dto.*;
import com.nextcalendar.dto.address.AddressCreateDTO;
import com.nextcalendar.dto.address.AddressUpdateDTO;
import com.nextcalendar.dto.establishment.EstablishmentCreateDTO;
import com.nextcalendar.dto.establishment.EstablishmentResponseDTO;
import com.nextcalendar.dto.establishment.EstablishmentUpdateDTO;
import com.nextcalendar.entity.AddressEmbeddable;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProfileEntity;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.DuplicateResourceException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.EstablishmentMapper;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.ProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class EstablishmentService {

    private static final Logger log = LoggerFactory.getLogger(EstablishmentService.class);
    private static final int TRIAL_DAYS = 30;

    private final EstablishmentRepository establishmentRepository;
    private final ProfileRepository profileRepository;
    private final ViaCepService viaCepService;

    public EstablishmentService(
            EstablishmentRepository establishmentRepository,
            ProfileRepository profileRepository,
            ViaCepService viaCepService
    ) {
        this.establishmentRepository = establishmentRepository;
        this.profileRepository = profileRepository;
        this.viaCepService = viaCepService;
    }

    // ------------------------------------------------------------------ UC01

    /**
     * UC01 — Cadastrar Estabelecimento.
     *
     * Fluxo principal:
     *  1. Valida termos de uso (pré-condição da UI, mas revalidado no back)
     *  2. Normaliza e valida CNPJ (formato + duplicidade → 409)
     *  3. Consulta ViaCEP para preencher o endereço (→ 422 se inválido)
     *  4. Cria o Establishment com trial de 30 dias
     *  5. Cria o Profile GESTOR do ownerId (regra de consistência)
     */
    @Transactional
    public EstablishmentResponseDTO createEstablishment(EstablishmentCreateDTO dto) {

        // Passo 1 — Termos de uso (regra de negócio)
        if (!Boolean.TRUE.equals(dto.termsAccepted())) {
            throw new BusinessException("Os termos de uso devem ser aceitos para criar o estabelecimento.");
        }

        // Passo 2 — Valida CNPJ
        String cnpjNormalizado = normalizarCnpj(dto.cnpj());

        // UC01 2a — CNPJ duplicado → 409
        if (establishmentRepository.existsByCnpj(cnpjNormalizado)) {
            throw new DuplicateResourceException(
                    "CNPJ '" + dto.cnpj() + "' já está cadastrado no sistema."
            );
        }

        // Passo 3 — Consulta CEP via ViaCEP (lança CepInvalidException se inválido)
        AddressCreateDTO addressDto = dto.address();
        AddressEmbeddable address = viaCepService.buscarEPreencherEndereco(
                addressDto.cep(),
                addressDto.number(),
                addressDto.complement()
        );

        // UC01 6b — API indisponível: usa dados manuais enviados pelo frontend
        if (address == null) {
            address = buildManualAddress(addressDto);
        }

        // Passo 4 — Monta e salva o Establishment
        EstablishmentEntity entity = EstablishmentMapper.toEntity(dto);
        entity.setCnpj(cnpjNormalizado);
        entity.setAddress(address);

        // Regra: TermsOfUse.Accepted = true para persistir
        entity.setTermsAccepted(true);
        entity.setTermsAcceptedAt(LocalDateTime.now());

        // Regra: TrialPeriod iniciado automaticamente (30 dias)
        LocalDateTime now = LocalDateTime.now();
        entity.setTrialStartDate(now);
        entity.setTrialEndDate(now.plusDays(TRIAL_DAYS));

        EstablishmentEntity saved = establishmentRepository.save(entity);

        // Passo 5 — Cria o primeiro Profile (GESTOR) do ownerId
        ProfileEntity profile = new ProfileEntity();
        profile.setEstablishment(saved);
        profile.setOwnerId(dto.ownerId());
        profile.setRole(ProfileEntity.ProfileRole.GESTOR);
        profileRepository.save(profile);

        return new EstablishmentResponseDTO(saved);
    }

    // ------------------------------------------------------------------ CRUD

    @Transactional(readOnly = true)
    public EstablishmentResponseDTO findById(UUID id) {
        EstablishmentEntity entity = getOrThrow(id);
        return new EstablishmentResponseDTO(entity);
    }

    /**
     * Atualização parcial — botão "Salvar" da tela Empresa.
     * Se o CEP mudar, re-consulta o ViaCEP automaticamente.
     */
    @Transactional
    public EstablishmentResponseDTO update(UUID id, EstablishmentUpdateDTO dto) {
        EstablishmentEntity entity = getOrThrow(id);

        EstablishmentMapper.updateEntity(entity, dto);

        // Atualiza endereço se informado
        if (dto.address() != null) {
            AddressUpdateDTO addrDto = dto.address();
            String novoCep = addrDto.cep();

            // Re-consulta ViaCEP apenas se o CEP foi alterado
            boolean cepMudou = novoCep != null && !novoCep.isBlank() &&
                    !novoCep.replaceAll("[^0-9]", "")
                            .equals(entity.getAddress() != null ? entity.getAddress().getCep() : "");

            if (cepMudou) {
                AddressEmbeddable novoEndereco = viaCepService.buscarEPreencherEndereco(
                        novoCep, addrDto.number(), addrDto.complement()
                );
                if (novoEndereco == null) {
                    novoEndereco = buildManualAddressFromUpdate(entity, addrDto);
                }
                EstablishmentMapper.updateAddress(entity, novoEndereco);
            } else {
                // Apenas atualiza número/complemento sem re-chamar ViaCEP
                if (entity.getAddress() != null) {
                    if (addrDto.number() != null) entity.getAddress().setNumber(addrDto.number());
                    if (addrDto.complement() != null) entity.getAddress().setComplement(addrDto.complement());
                }
            }
        }

        EstablishmentEntity saved = establishmentRepository.save(entity);
        return new EstablishmentResponseDTO(saved);
    }

    /**
     * Soft delete — desativa o establishment sem remover do banco.
     */
    @Transactional
    public void delete(UUID id) {
        EstablishmentEntity entity = getOrThrow(id);
        entity.setActive(false);
        establishmentRepository.save(entity);
    }

    // ------------------------------------------------------------------ UC03

    /**
     * UC03 — Busca o establishment vinculado ao ownerId.
     * Fluxo alternativo 1a: não encontrado → 404.
     */
    @Transactional(readOnly = true)
    public EstablishmentResponseDTO findByOwnerId(UUID ownerId) {
        EstablishmentEntity entity = establishmentRepository
                .findFirstByOwnerIdAndActiveTrue(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Estabelecimento para o proprietário", ownerId));
        return new EstablishmentResponseDTO(entity);
    }

    // ------------------------------------------------------------------ UC04

    /**
     * UC04 — Registra o aceite dos termos de uso.
     * Fluxo alternativo 2a: se chamado com recusa, mantém termsAccepted=false.
     */
    @Transactional
    public EstablishmentResponseDTO acceptTerms(UUID id) {
        EstablishmentEntity entity = getOrThrow(id);
        entity.setTermsAccepted(true);
        entity.setTermsAcceptedAt(LocalDateTime.now());
        return new EstablishmentResponseDTO(establishmentRepository.save(entity));
    }

    // ------------------------------------------------------------------ UC05

    /**
     * UC05 — Retorna o status do trial com dias restantes calculados.
     * warningActive = true quando restam <= 7 dias.
     */
    @Transactional(readOnly = true)
    public TrialStatusDTO getTrialStatus(UUID id) {
        EstablishmentEntity entity = getOrThrow(id);
        LocalDateTime now = LocalDateTime.now();
        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(now, entity.getTrialEndDate()));
        boolean trialExpired = now.isAfter(entity.getTrialEndDate());
        boolean trialActive = !trialExpired;
        boolean warningActive = trialActive && daysRemaining <= 7;

        return new TrialStatusDTO(
                entity.getId(),
                entity.getTrialStartDate(),
                entity.getTrialEndDate(),
                daysRemaining,
                trialActive,
                warningActive,
                trialExpired
        );
    }

    // ------------------------------------------------------------------ helpers

    private EstablishmentEntity getOrThrow(UUID id) {
        return establishmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Estabelecimento", id));
    }

    /** Normaliza o CNPJ removendo pontuação e valida o formato (14 dígitos). */
    private String normalizarCnpj(String cnpj) {
        if (cnpj == null) throw new BusinessException("CNPJ é obrigatório.");
        String normalizado = cnpj.replaceAll("[^0-9]", "");
        if (normalizado.length() != 14) {
            throw new BusinessException("CNPJ inválido — deve conter 14 dígitos numéricos: " + cnpj);
        }
        return normalizado;
    }

    /** UC01 6b — monta endereço com dados manuais enviados pelo frontend. */
    private AddressEmbeddable buildManualAddress(AddressCreateDTO dto) {
        return new AddressEmbeddable(
                dto.cep() != null ? dto.cep().replaceAll("[^0-9]", "") : null,
                dto.street(),
                dto.number(),
                dto.complement(),
                dto.neighborhood(),
                dto.city(),
                dto.state()
        );
    }

    /** UC01 6b — variante para update: preserva campos existentes se não informados. */
    private AddressEmbeddable buildManualAddressFromUpdate(EstablishmentEntity entity, AddressUpdateDTO dto) {
        AddressEmbeddable existing = entity.getAddress() != null ? entity.getAddress() : new AddressEmbeddable();
        return new AddressEmbeddable(
                dto.cep() != null ? dto.cep().replaceAll("[^0-9]", "") : existing.getCep(),
                dto.street() != null ? dto.street() : existing.getStreet(),
                dto.number() != null ? dto.number() : existing.getNumber(),
                dto.complement() != null ? dto.complement() : existing.getComplement(),
                dto.neighborhood() != null ? dto.neighborhood() : existing.getNeighborhood(),
                dto.city() != null ? dto.city() : existing.getCity(),
                dto.state() != null ? dto.state() : existing.getState()
        );
    }
}
