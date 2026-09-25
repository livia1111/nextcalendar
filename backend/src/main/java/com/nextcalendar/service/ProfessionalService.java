package com.nextcalendar.service;

import com.nextcalendar.dto.professional.*;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.ProfessionalEntity;
import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.entity.UserRole;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.mapper.ProfessionalMapper;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.ProfessionalRepository;
import com.nextcalendar.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfessionalService {

    private final ProfessionalRepository professionalRepository;
    private final EstablishmentRepository establishmentRepository;
    private final UserRepository userRepository;
    private final ProfessionalMapper professionalMapper;
    private final PasswordEncoder passwordEncoder;

    public ProfessionalService(ProfessionalRepository professionalRepository,
                               EstablishmentRepository establishmentRepository,
                               UserRepository userRepository,
                               ProfessionalMapper professionalMapper,
                               PasswordEncoder passwordEncoder) {
        this.professionalRepository = professionalRepository;
        this.establishmentRepository = establishmentRepository;
        this.userRepository = userRepository;
        this.professionalMapper = professionalMapper;
        this.passwordEncoder = passwordEncoder;
    }


    private EstablishmentEntity findEstablishment(UUID establishmentId) {
        return establishmentRepository.findById(establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Estabelecimento", establishmentId));
    }

    private ProfessionalEntity findProfessional(UUID id) {
        return professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profissional", id));
    }

    public ProfessionalMeResponseDTO getMyProfile(UUID userId) {
        ProfessionalEntity professional = professionalRepository.findByUser_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException("Profissional vinculado ao usuário", userId));
        return new ProfessionalMeResponseDTO(professional);
    }

    @Transactional
    public ProfessionalProfileResponseDTO createProfessional(UUID establishmentId, ProfessionalCreateDTO dto) {

        if (userRepository.existsByEmail(dto.email()) || professionalRepository.existsByEmail(dto.email())) {
            throw new BusinessException("O e-mail '" + dto.email() + "' já está cadastrado no sistema.");
        }

        if (professionalRepository.existsByCpf(dto.cpf())) {
            throw new BusinessException("O CPF '" + dto.cpf() + "' já está cadastrado no sistema.");
        }

        EstablishmentEntity establishment = findEstablishment(establishmentId);

        UserEntity user = new UserEntity();
        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        user.setRole(UserRole.PROFESSIONAL);
        user.setActive(true);

        UserEntity savedUser = userRepository.save(user);

        ProfessionalEntity professional = professionalMapper.toEntity(dto, establishment);
        professional.setUser(savedUser);

        ProfessionalEntity savedProfessional = professionalRepository.save(professional);

        return new ProfessionalProfileResponseDTO(savedProfessional);
    }

    @Transactional
    public ProfessionalDetailsResponseDTO updateProfessionalByAdmin(UUID id, ProfessionalAdminUpdateDTO dto) {

        ProfessionalEntity professional = findProfessional(id);

        if (dto.email() != null && !dto.email().isBlank() && !dto.email().equals(professional.getEmail())) {
            boolean emailExistsInUsers = userRepository.findByEmail(dto.email())
                    .filter(u -> professional.getUser() == null || !u.getId().equals(professional.getUser().getId()))
                    .isPresent();

            if (emailExistsInUsers || professionalRepository.existsByEmailAndIdNot(dto.email(), id)) {
                throw new BusinessException("O e-mail '" + dto.email() + "' já está sendo usado no sistema.");
            }
        }

        if (dto.cpf() != null && !dto.cpf().isBlank() && !dto.cpf().equals(professional.getCpf())) {
            if (professionalRepository.existsByCpfAndIdNot(dto.cpf(), id)) {
                throw new BusinessException("O CPF '" + dto.cpf() + "' já está sendo usado por outro profissional.");
            }
        }
        professionalMapper.updateEntityFromAdmin(professional, dto);

        if (professional.getUser() != null) {
            if (dto.name() != null && !dto.name().isBlank()) {
                professional.getUser().setName(dto.name());
            }
            if (dto.email() != null && !dto.email().isBlank()) {
                professional.getUser().setEmail(dto.email());
            }
            if (dto.active() != null) {
                professional.getUser().setActive(dto.active());
            }
        }

        ProfessionalEntity updatedProfessional = professionalRepository.save(professional);

        return new ProfessionalDetailsResponseDTO(updatedProfessional);
    }

    @Transactional
    public ProfessionalProfileResponseDTO updateProfessionalBySelf(UUID id, ProfessionalSelfUpdateDTO dto) {

        ProfessionalEntity professional = findProfessional(id);

        if (dto.email() != null && !dto.email().isBlank() && !dto.email().equals(professional.getEmail())) {

            boolean emailExistsInUsers = userRepository.findByEmail(dto.email())
                    .filter(u -> professional.getUser() == null || !u.getId().equals(professional.getUser().getId()))
                    .isPresent();

            if (emailExistsInUsers || professionalRepository.existsByEmailAndIdNot(dto.email(), id)) {
                throw new BusinessException("O e-mail '" + dto.email() + "' já está sendo usado no sistema.");
            }
        }

        professionalMapper.updateEntityFromSelf(professional, dto);

        if (professional.getUser() != null) {
            if (dto.name() != null && !dto.name().isBlank()) {
                professional.getUser().setName(dto.name());
            }
            if (dto.email() != null && !dto.email().isBlank()) {
                professional.getUser().setEmail(dto.email());
            }
        }

        ProfessionalEntity updatedProfessional = professionalRepository.save(professional);

        return new ProfessionalProfileResponseDTO(updatedProfessional);
    }

    @Transactional(readOnly = true)
    public ProfessionalDetailsResponseDTO findProfessionalById(UUID id) {
        ProfessionalEntity professional = findProfessional(id);

        return new ProfessionalDetailsResponseDTO(professional);
    }

    @Transactional(readOnly = true)
    public ProfessionalDetailsResponseDTO findProfessionalByIdAndEstablishment(UUID id, UUID establishmentId) {
        findEstablishment(establishmentId);

        ProfessionalEntity professional = professionalRepository
                .findByIdAndEstablishmentId(id, establishmentId)
                .orElseThrow(() -> new EntityNotFoundException("Profissional", id));

        return new ProfessionalDetailsResponseDTO(professional);
    }

    @Transactional(readOnly = true)
    public Page<ProfessionalMinResponseDTO> findByEstablishment(UUID establishmentId, Pageable pageable) {

        findEstablishment(establishmentId);

        return professionalRepository.findByEstablishmentId(establishmentId, pageable)
                .map(ProfessionalMinResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Page<ProfessionalMinResponseDTO> findActiveByEstablishment(UUID establishmentId, Pageable pageable) {

        findEstablishment(establishmentId);

        return professionalRepository.findByEstablishmentIdAndActiveTrue(establishmentId, pageable)
                .map(ProfessionalMinResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Page<ProfessionalMinResponseDTO> findByNameAndEstablishment(UUID establishmentId, String name, Pageable pageable) {
        findEstablishment(establishmentId);

        return professionalRepository
                .findByEstablishmentIdAndNameContainingIgnoreCase(establishmentId, name, pageable)
                .map(ProfessionalMinResponseDTO::new);
    }

    @Transactional
    public void deleteProfessional(UUID id) {
        ProfessionalEntity professional = findProfessional(id);

        professional.setActive(false);

        if (professional.getUser() != null) {
            professional.getUser().setActive(false);
        }

        professionalRepository.save(professional);
    }
}