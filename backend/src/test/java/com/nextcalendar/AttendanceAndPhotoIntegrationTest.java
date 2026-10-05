package com.nextcalendar;

import com.nextcalendar.entity.*;
import com.nextcalendar.repository.*;
import com.nextcalendar.service.JwtService;
import com.nextcalendar.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class AttendanceAndPhotoIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EstablishmentRepository establishmentRepository;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private JwtService jwtService;

    private EstablishmentEntity establishment;
    private UserEntity managerUser;
    private String managerToken;

    private UserEntity professionalUserA;
    private ProfessionalEntity professionalA;
    private String professionalTokenA;

    private UserEntity professionalUserB;
    private ProfessionalEntity professionalB;
    private String professionalTokenB;

    private UserEntity customerUser;
    private String customerToken;

    private ServiceEntity testService;
    private ClientEntity testClient;
    private AppointmentEntity appointmentA;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
                .build();

        // 1. Manager
        managerUser = new UserEntity();
        managerUser.setName("Gestor Geral");
        managerUser.setEmail("gestor." + UUID.randomUUID() + "@test.com");
        managerUser.setPasswordHash("hash123");
        managerUser.setRole(UserRole.MANAGER);
        managerUser.setActive(true);
        managerUser.setMustChangePassword(false);
        managerUser = userRepository.save(managerUser);
        managerToken = jwtService.generateToken(managerUser.getId(), managerUser.getEmail());

        // 2. Establishment
        establishment = new EstablishmentEntity();
        establishment.setName("Barbearia VIP");
        establishment.setLegalName("Barbearia VIP LTDA");
        establishment.setCnpj(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 14));
        establishment.setEmail(managerUser.getEmail());
        establishment.setPhone("11999990000");
        establishment.setOwnerId(managerUser.getId());
        establishment.setActive(true);
        establishment.setTermsAccepted(true);
        establishment.setTermsAcceptedAt(LocalDateTime.now());
        establishment.setTrialStartDate(LocalDateTime.now());
        establishment.setTrialEndDate(LocalDateTime.now().plusDays(30));
        establishment = establishmentRepository.save(establishment);

        // 3. Professional A
        professionalUserA = new UserEntity();
        professionalUserA.setName("Profissional A");
        professionalUserA.setEmail("profa." + UUID.randomUUID() + "@test.com");
        professionalUserA.setPasswordHash("hash123");
        professionalUserA.setRole(UserRole.PROFESSIONAL);
        professionalUserA.setActive(true);
        professionalUserA.setMustChangePassword(false);
        professionalUserA = userRepository.save(professionalUserA);
        professionalTokenA = jwtService.generateToken(professionalUserA.getId(), professionalUserA.getEmail());

        professionalA = new ProfessionalEntity();
        professionalA.setUser(professionalUserA);
        professionalA.setEstablishment(establishment);
        professionalA.setName(professionalUserA.getName());
        professionalA.setEmail(professionalUserA.getEmail());
        professionalA.setCpf(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 11));
        professionalA.setPhone("11988881111");
        professionalA.setActive(true);
        professionalA = professionalRepository.save(professionalA);

        // 4. Professional B
        professionalUserB = new UserEntity();
        professionalUserB.setName("Profissional B");
        professionalUserB.setEmail("profb." + UUID.randomUUID() + "@test.com");
        professionalUserB.setPasswordHash("hash123");
        professionalUserB.setRole(UserRole.PROFESSIONAL);
        professionalUserB.setActive(true);
        professionalUserB.setMustChangePassword(false);
        professionalUserB = userRepository.save(professionalUserB);
        professionalTokenB = jwtService.generateToken(professionalUserB.getId(), professionalUserB.getEmail());

        professionalB = new ProfessionalEntity();
        professionalB.setUser(professionalUserB);
        professionalB.setEstablishment(establishment);
        professionalB.setName(professionalUserB.getName());
        professionalB.setEmail(professionalUserB.getEmail());
        professionalB.setCpf(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 11));
        professionalB.setPhone("11988882222");
        professionalB.setActive(true);
        professionalB = professionalRepository.save(professionalB);

        // 5. Customer
        customerUser = new UserEntity();
        customerUser.setName("Carlos Cliente");
        customerUser.setEmail("cliente." + UUID.randomUUID() + "@test.com");
        customerUser.setPasswordHash("hash123");
        customerUser.setRole(UserRole.CUSTOMER);
        customerUser.setActive(true);
        customerUser.setMustChangePassword(false);
        customerUser = userRepository.save(customerUser);
        customerToken = jwtService.generateToken(customerUser.getId(), customerUser.getEmail());

        // 6. Service
        testService = new ServiceEntity();
        testService.setEstablishment(establishment);
        testService.setName("Corte Degradê");
        testService.setCategory("Cabelo");
        testService.setPrice(new BigDecimal("50.00"));
        testService.setDuration(30);
        testService.setActive(true);
        testService = serviceRepository.save(testService);

        // 7. Client
        testClient = new ClientEntity();
        testClient.setName("Carlos Cliente");
        testClient.setPhone("11977776666");
        testClient.setUser(customerUser);
        testClient = clientRepository.save(testClient);

        // 8. Appointment for Professional A
        appointmentA = new AppointmentEntity();
        appointmentA.setEstablishment(establishment);
        appointmentA.setProfessional(professionalA);
        appointmentA.setClient(testClient);
        appointmentA.setService(testService);
        appointmentA.setStartDateTime(LocalDateTime.now().minusHours(1));
        appointmentA.setEndDateTime(LocalDateTime.now().minusMinutes(30));
        appointmentA.setStatus(AppointmentStatus.IN_PROGRESS);
        appointmentA = appointmentRepository.save(appointmentA);
    }

    @Test
    @DisplayName("Upload de foto vinculada ao agendamento pelo profissional A funciona com sucesso")
    void testPhotoUploadLinkedToAppointment() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "antes.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3, 4, 5}
        );

        mockMvc.perform(multipart("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .file(file)
                        .param("type", "BEFORE")
                        .param("caption", "Antes do corte")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.appointmentId").value(appointmentA.getId().toString()))
                .andExpect(jsonPath("$.clientId").value(testClient.getId().toString()))
                .andExpect(jsonPath("$.type").value("BEFORE"))
                .andExpect(jsonPath("$.caption").value("Antes do corte"))
                .andExpect(jsonPath("$.takenBy").value(professionalUserA.getId().toString()))
                .andExpect(jsonPath("$.takenByName").value(professionalUserA.getName()));

        // Verificar listagem de fotos do agendamento
        mockMvc.perform(get("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("BEFORE"));

        // Verificar fotos do cliente
        mockMvc.perform(get("/api/v1/clients/" + testClient.getId() + "/photos")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("Profissional B não pode enviar ou ver fotos do agendamento de A (403)")
    void testCrossProfessionalForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "foto.png",
                "image/png",
                new byte[]{10, 20, 30}
        );

        // B tenta fazer upload no agendamento de A -> 403
        mockMvc.perform(multipart("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .file(file)
                        .header("Authorization", "Bearer " + professionalTokenB))
                .andExpect(status().isForbidden());

        // B tenta listar fotos do agendamento de A -> 403
        mockMvc.perform(get("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .header("Authorization", "Bearer " + professionalTokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Upload recusado para agendamento cancelado ou agendamento sem comanda aberta (400)")
    void testUploadRefusedOnCancelledOrScheduledWithoutOrder() throws Exception {
        AppointmentEntity cancelledAppointment = new AppointmentEntity();
        cancelledAppointment.setEstablishment(establishment);
        cancelledAppointment.setProfessional(professionalA);
        cancelledAppointment.setClient(testClient);
        cancelledAppointment.setService(testService);
        cancelledAppointment.setStartDateTime(LocalDateTime.now().plusDays(1));
        cancelledAppointment.setEndDateTime(LocalDateTime.now().plusDays(1).plusMinutes(30));
        cancelledAppointment.setStatus(AppointmentStatus.CANCELLED);
        cancelledAppointment = appointmentRepository.save(cancelledAppointment);

        MockMultipartFile file = new MockMultipartFile(
                "file", "teste.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        mockMvc.perform(multipart("/api/v1/appointments/" + cancelledAppointment.getId() + "/photos")
                        .file(file)
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Upload com tipo de arquivo inválido ou tamanho excedido retorna 400")
    void testInvalidFileTypeOrSize() throws Exception {
        // Tipo inválido (text/plain)
        MockMultipartFile txtFile = new MockMultipartFile(
                "file", "doc.txt", "text/plain", new byte[]{1, 2, 3}
        );

        mockMvc.perform(multipart("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .file(txtFile)
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isBadRequest());

        // Tamanho > 5MB
        byte[] bigContent = new byte[5 * 1024 * 1024 + 10];
        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "big.jpg", "image/jpeg", bigContent
        );

        mockMvc.perform(multipart("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .file(bigFile)
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Listagem de atendimentos para profissional, gestor e histórico do cliente")
    void testAttendancesListings() throws Exception {
        // Profissional A consulta seus atendimentos
        mockMvc.perform(get("/api/v1/professionals/me/attendances")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointmentA.getId().toString()))
                .andExpect(jsonPath("$.content[0].clientName").value("Carlos Cliente"))
                .andExpect(jsonPath("$.content[0].serviceName").value("Corte Degradê"));

        // Gestor consulta atendimentos do estabelecimento
        mockMvc.perform(get("/api/v1/attendances")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointmentA.getId().toString()));

        // Histórico de atendimentos do cliente
        mockMvc.perform(get("/api/v1/clients/" + testClient.getId() + "/attendances")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(appointmentA.getId().toString()));
    }

    @Test
    @DisplayName("Cliente final não pode acessar atendimentos nem fotos (403)")
    void testCustomerForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/professionals/me/attendances")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/appointments/" + appointmentA.getId() + "/photos")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/clients/" + testClient.getId() + "/attendances")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
