package com.nextcalendar.service;

import com.nextcalendar.dto.login_register.ChangePasswordRequestDTO;
import com.nextcalendar.dto.login_register.LoginRequestDTO;
import com.nextcalendar.dto.login_register.LoginResponseDTO;
import com.nextcalendar.dto.login_register.RegisterRequestDTO;
import com.nextcalendar.entity.UserEntity;
import com.nextcalendar.entity.EstablishmentEntity;
import com.nextcalendar.entity.AddressEmbeddable;
import com.nextcalendar.entity.UserRole;
import com.nextcalendar.exception.BusinessException;
import com.nextcalendar.exception.DuplicateResourceException;
import com.nextcalendar.exception.EntityNotFoundException;
import com.nextcalendar.repository.UserRepository;
import com.nextcalendar.repository.EstablishmentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EstablishmentRepository establishmentRepository;
    private final ClientService clientService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       EstablishmentRepository establishmentRepository,
                       ClientService clientService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.establishmentRepository = establishmentRepository;
        this.clientService = clientService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO dto) {
        UserEntity user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new BusinessException("Email ou senha inválidos"));

        if (!user.getActive()) {
            throw new BusinessException("Conta desativada. Entre em contato com o suporte.");
        }

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new BusinessException("Email ou senha inválidos");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new LoginResponseDTO(
                token,
                new LoginResponseDTO.UserInfoDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), Boolean.TRUE.equals(user.getMustChangePassword()))
        );
    }

    // ─── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public LoginResponseDTO register(RegisterRequestDTO dto) {
        if (userRepository.existsByEmail(dto.email())) {
            throw new DuplicateResourceException("Email já cadastrado");
        }

        if (dto.role() == UserRole.MANAGER) {
            if (dto.cnpj() == null || dto.cnpj().isBlank()) {
                throw new BusinessException("CNPJ é obrigatório para cadastro de estabelecimento");
            }
            if (dto.cep() == null || dto.street() == null || dto.number() == null
                    || dto.neighborhood() == null || dto.city() == null || dto.state() == null) {
                throw new BusinessException("Endereço completo é obrigatório para cadastro de estabelecimento");
            }
        }

        UserEntity user = new UserEntity();
        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        user.setRole(dto.role());
        user.setActive(true);

        UserEntity saved = userRepository.save(user);

        if (saved.getRole() == UserRole.MANAGER) {
            if (establishmentRepository.existsByCnpj(dto.cnpj().replaceAll("\\D", ""))) {
                throw new DuplicateResourceException("CNPJ já cadastrado");
            }
            EstablishmentEntity est = new EstablishmentEntity();
            est.setOwnerId(saved.getId());
            est.setName(dto.name());
            est.setLegalName(dto.name());
            est.setCnpj(dto.cnpj().replaceAll("\\D", ""));
            est.setPhone(dto.phone());
            est.setWhatsapp(dto.whatsapp());
            est.setEmail(dto.email());
            est.setTermsAccepted(true);
            est.setTermsAcceptedAt(java.time.LocalDateTime.now());
            est.setTrialStartDate(java.time.LocalDateTime.now());
            est.setTrialEndDate(java.time.LocalDateTime.now().plusDays(30));

            AddressEmbeddable address = new AddressEmbeddable();
            address.setCep(dto.cep());
            address.setStreet(dto.street());
            address.setNumber(dto.number());
            address.setComplement(dto.complement());
            address.setCity(dto.city());
            address.setNeighborhood(dto.neighborhood());
            address.setState(dto.state());
            est.setAddress(address);

            establishmentRepository.save(est);
        }

        if (saved.getRole() == UserRole.CUSTOMER) {
            clientService.createClientFromRegistration(saved, dto);
        }

        emailService.sendConfirmationEmail(saved.getEmail(), saved.getName());

        String token = jwtService.generateToken(saved.getId(), saved.getEmail());

        return new LoginResponseDTO(
                token,
                new LoginResponseDTO.UserInfoDTO(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), Boolean.TRUE.equals(saved.getMustChangePassword()))
        );
    }

    // ─── Troca de senha ───────────────────────────────────────────────────────

    /**
     * POST /api/v1/auth/change-password
     *
     * O userId vem do token JWT (passado por quem chama), nunca do payload.
     * - Valida a senha atual contra o hash armazenado
     * - Exige newPassword com no mínimo 8 caracteres e diferente da atual
     * - Grava novo hash e seta mustChangePassword = false
     */
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequestDTO dto) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário", userId));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Senha atual incorreta.");
        }

        if (dto.newPassword().length() < 8) {
            throw new BusinessException("A nova senha deve ter no mínimo 8 caracteres.");
        }

        boolean hasLetter = dto.newPassword().chars().anyMatch(Character::isLetter);
        boolean hasDigit  = dto.newPassword().chars().anyMatch(Character::isDigit);
        if (!hasLetter || !hasDigit) {
            throw new BusinessException("A nova senha deve conter ao menos uma letra e um número.");
        }

        if (passwordEncoder.matches(dto.newPassword(), user.getPasswordHash())) {
            throw new BusinessException("A nova senha não pode ser igual à senha atual.");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    /** Extrai o userId do token JWT. Usado pelo AuthController. */
    public UUID extractUserIdFromToken(String token) {
        return jwtService.extractUserId(token);
    }
}
