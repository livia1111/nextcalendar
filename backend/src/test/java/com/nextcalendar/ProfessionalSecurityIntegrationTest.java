package com.nextcalendar;

import tools.jackson.databind.ObjectMapper;
import com.nextcalendar.dto.appointment.BlockedTimeCreateDTO;
import com.nextcalendar.dto.services.ServiceCreateDTO;
import com.nextcalendar.entity.*;
import com.nextcalendar.repository.EstablishmentRepository;
import com.nextcalendar.repository.ProfessionalRepository;
import com.nextcalendar.repository.UserRepository;
import com.nextcalendar.repository.WorkingHoursRepository;
import com.nextcalendar.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
class ProfessionalSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EstablishmentRepository establishmentRepository;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private WorkingHoursRepository workingHoursRepository;

    @Autowired
    private JwtService jwtService;

    private UserEntity professionalUser;
    private ProfessionalEntity professionalEntity;
    private EstablishmentEntity establishmentEntity;
    private String professionalToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
                .build();
        // Cria usuário de estabelecimento / gestor
        UserEntity managerUser = new UserEntity();
        managerUser.setName("Gestor Teste");
        managerUser.setEmail("gestor.test." + UUID.randomUUID() + "@email.com");
        managerUser.setPasswordHash("hash123");
        managerUser.setRole(UserRole.MANAGER);
        managerUser.setActive(true);
        managerUser = userRepository.save(managerUser);

        // Cria estabelecimento
        establishmentEntity = new EstablishmentEntity();
        establishmentEntity.setName("Barbearia Teste");
        establishmentEntity.setLegalName("Barbearia Teste LTDA");
        establishmentEntity.setCnpj(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 14));
        establishmentEntity.setOwnerId(managerUser.getId());
        establishmentEntity.setEmail("barbearia." + UUID.randomUUID() + "@email.com");
        establishmentEntity.setPhone("11999999999");
        establishmentEntity.setWhatsapp("11999999999");
        establishmentEntity.setTermsAccepted(true);
        establishmentEntity.setTermsAcceptedAt(LocalDateTime.now());
        establishmentEntity.setTrialStartDate(LocalDateTime.now());
        establishmentEntity.setTrialEndDate(LocalDateTime.now().plusDays(30));
        establishmentEntity = establishmentRepository.save(establishmentEntity);

        // Cria usuário profissional
        professionalUser = new UserEntity();
        professionalUser.setName("Barbeiro Silva");
        professionalUser.setEmail("barbeiro." + UUID.randomUUID() + "@email.com");
        professionalUser.setPasswordHash("hash123");
        professionalUser.setRole(UserRole.PROFESSIONAL);
        professionalUser.setActive(true);
        professionalUser.setMustChangePassword(false);
        professionalUser = userRepository.save(professionalUser);

        // Cria entidade profissional
        professionalEntity = new ProfessionalEntity();
        professionalEntity.setUser(professionalUser);
        professionalEntity.setEstablishment(establishmentEntity);
        professionalEntity.setName(professionalUser.getName());
        professionalEntity.setEmail(professionalUser.getEmail());
        professionalEntity.setCpf(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 11));
        professionalEntity.setPhone("11988888888");
        professionalEntity.setCommission(new BigDecimal("50.00"));
        professionalEntity.setActive(true);
        professionalEntity = professionalRepository.save(professionalEntity);

        // Cria horário de trabalho: segunda-feira das 08:00 às 18:00
        WorkingHoursEntity wh = new WorkingHoursEntity();
        wh.setProfessional(professionalEntity);
        wh.setDayOfWeek(DayOfWeek.MONDAY);
        wh.setStartTime(LocalTime.of(8, 0));
        wh.setEndTime(LocalTime.of(18, 0));
        wh.setActive(true);
        workingHoursRepository.save(wh);

        // Gera token para o profissional
        professionalToken = "Bearer " + jwtService.generateToken(professionalUser.getId(), professionalUser.getEmail());
    }

    @Test
    @DisplayName("GET /api/v1/professionals/me deve retornar dados do próprio profissional autenticado")
    void shouldReturnMyProfile() throws Exception {
        mockMvc.perform(get("/api/v1/professionals/me")
                        .header("Authorization", professionalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(professionalEntity.getId().toString()))
                .andExpect(jsonPath("$.name").value("Barbeiro Silva"))
                .andExpect(jsonPath("$.establishmentId").value(establishmentEntity.getId().toString()));
    }

    @Test
    @DisplayName("Profissional NÃO deve conseguir cadastrar serviço (espera 403 Forbidden)")
    void shouldDenyProfessionalCreatingService() throws Exception {
        ServiceCreateDTO dto = new ServiceCreateDTO("Corte Degradê", new BigDecimal("45.00"), 30, "Cabelo");

        mockMvc.perform(post("/api/v1/establishments/" + establishmentEntity.getId() + "/services")
                        .header("Authorization", professionalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Profissional NÃO deve conseguir criar horário de trabalho (espera 403 Forbidden)")
    void shouldDenyProfessionalCreatingWorkingHours() throws Exception {
        String body = """
                {
                    "dayOfWeek": "TUESDAY",
                    "startTime": "09:00",
                    "endTime": "17:00"
                }
                """;

        mockMvc.perform(post("/api/v1/establishments/" + establishmentEntity.getId() + "/professionals/" + professionalEntity.getId() + "/working-hours")
                        .header("Authorization", professionalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Bloqueio fora do expediente (ex: domingo) deve ser rejeitado")
    void shouldRejectBlockOutsideWorkingHoursDay() throws Exception {
        // Próximo domingo
        LocalDateTime nextSunday = LocalDateTime.now();
        while (nextSunday.getDayOfWeek() != DayOfWeek.SUNDAY) {
            nextSunday = nextSunday.plusDays(1);
        }
        LocalDateTime start = nextSunday.withHour(10).withMinute(0);
        LocalDateTime end = nextSunday.withHour(12).withMinute(0);

        BlockedTimeCreateDTO dto = new BlockedTimeCreateDTO(start, end, "Almoço em família");

        mockMvc.perform(post("/api/v1/establishments/" + establishmentEntity.getId() + "/professionals/" + professionalEntity.getId() + "/blocked-times")
                        .header("Authorization", professionalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("não atende")));
    }

    @Test
    @DisplayName("Bloqueio fora do horário de expediente (ex: 19h às 20h em dia que encerra às 18h) deve ser rejeitado")
    void shouldRejectBlockOutsideWorkingHoursTime() throws Exception {
        // Próxima segunda-feira
        LocalDateTime nextMonday = LocalDateTime.now();
        while (nextMonday.getDayOfWeek() != DayOfWeek.MONDAY) {
            nextMonday = nextMonday.plusDays(1);
        }
        LocalDateTime start = nextMonday.withHour(19).withMinute(0);
        LocalDateTime end = nextMonday.withHour(20).withMinute(0);

        BlockedTimeCreateDTO dto = new BlockedTimeCreateDTO(start, end, "Hora extra recusada");

        mockMvc.perform(post("/api/v1/establishments/" + establishmentEntity.getId() + "/professionals/" + professionalEntity.getId() + "/blocked-times")
                        .header("Authorization", professionalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("expediente de trabalho")));
    }

    @Test
    @DisplayName("Bloqueio dentro do expediente (ex: segunda 13h às 16h) deve ser aceito")
    void shouldAcceptBlockInsideWorkingHours() throws Exception {
        // Próxima segunda-feira
        LocalDateTime nextMonday = LocalDateTime.now();
        while (nextMonday.getDayOfWeek() != DayOfWeek.MONDAY) {
            nextMonday = nextMonday.plusDays(1);
        }
        LocalDateTime start = nextMonday.withHour(13).withMinute(0);
        LocalDateTime end = nextMonday.withHour(16).withMinute(0);

        BlockedTimeCreateDTO dto = new BlockedTimeCreateDTO(start, end, "Médico");

        mockMvc.perform(post("/api/v1/establishments/" + establishmentEntity.getId() + "/professionals/" + professionalEntity.getId() + "/blocked-times")
                        .header("Authorization", professionalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.reason").value("Médico"));
    }
}
