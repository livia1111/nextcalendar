package com.nextcalendar;

import tools.jackson.databind.ObjectMapper;
import com.nextcalendar.dto.order.OrderItemAddDTO;
import com.nextcalendar.dto.order.OrderUpdateDTO;
import com.nextcalendar.dto.product.ProductCreateDTO;
import com.nextcalendar.entity.*;
import com.nextcalendar.repository.*;
import com.nextcalendar.service.AppointmentService;
import com.nextcalendar.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class ComandaIntegrationTest {

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
    private ServiceRepository serviceRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AppointmentService appointmentService;

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

    private ServiceEntity testService;
    private ProductEntity testProduct;
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
        managerUser = userRepository.save(managerUser);
        managerToken = jwtService.generateToken(managerUser.getId(), managerUser.getEmail());

        // 2. Establishment
        establishment = new EstablishmentEntity();
        establishment.setName("Barbearia Integration");
        establishment.setLegalName("Barbearia Integration LTDA");
        establishment.setCnpj(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 14));
        establishment.setOwnerId(managerUser.getId());
        establishment.setEmail("barb." + UUID.randomUUID() + "@test.com");
        establishment.setPhone("11999990000");
        establishment.setWhatsapp("11999990000");
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
        professionalA.setName("Profissional A");
        professionalA.setEmail(professionalUserA.getEmail());
        professionalA.setCpf(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 11));
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
        professionalB.setName("Profissional B");
        professionalB.setEmail(professionalUserB.getEmail());
        professionalB.setCpf(UUID.randomUUID().toString().replaceAll("\\D", "").substring(0, 11));
        professionalB.setActive(true);
        professionalB = professionalRepository.save(professionalB);

        // 5. Service & Product & Client
        testService = new ServiceEntity();
        testService.setEstablishment(establishment);
        testService.setName("Corte Premium " + UUID.randomUUID());
        testService.setCategory("Cabelo");
        testService.setPrice(new BigDecimal("60.00"));
        testService.setDuration(40);
        testService.setActive(true);
        testService = serviceRepository.save(testService);

        testProduct = new ProductEntity();
        testProduct.setEstablishment(establishment);
        testProduct.setName("Gel Fixador " + UUID.randomUUID());
        testProduct.setCategory("Finalizador");
        testProduct.setPrice(new BigDecimal("35.00"));
        testProduct.setStockQuantity(10);
        testProduct.setActive(true);
        testProduct = productRepository.save(testProduct);

        testClient = new ClientEntity();
        testClient.setName("Cliente Fulano");
        testClient.setPhone("11988887777");
        testClient.setEmail("cliente." + UUID.randomUUID() + "@test.com");
        testClient.setActive(true);
        testClient = clientRepository.save(testClient);

        // 6. Appointment for Professional A
        appointmentA = new AppointmentEntity();
        appointmentA.setEstablishment(establishment);
        appointmentA.setProfessional(professionalA);
        appointmentA.setClient(testClient);
        appointmentA.setService(testService);
        appointmentA.setStartDateTime(LocalDateTime.now().plusDays(2).withHour(10).withMinute(0));
        appointmentA.setEndDateTime(LocalDateTime.now().plusDays(2).withHour(10).withMinute(40));
        appointmentA.setStatus(AppointmentStatus.CONFIRMED);
        appointmentA.setFitIn(false);
        appointmentA = appointmentRepository.save(appointmentA);
    }

    @Test
    @DisplayName("Gestor pode criar produto, mas profissional recebe 403 Forbidden")
    void testProductCreationRolePermission() throws Exception {
        ProductCreateDTO productDTO = new ProductCreateDTO("Pomada Matte " + UUID.randomUUID(), "Cabelo", new BigDecimal("45.00"), 15);

        // Gestor cria produto com sucesso -> 201 CREATED
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/products")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(productDTO.name()));

        // Profissional tenta criar produto -> 403 FORBIDDEN
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/products")
                        .header("Authorization", "Bearer " + professionalTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productDTO)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Abrir comanda para agendamento, adicionar item e finalizar comanda fechando pedido e concluindo agendamento")
    void testOpenAddAndFinishOrder() throws Exception {
        // 1. Profissional A abre comanda do seu agendamento
        String openResponse = mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/appointments/" + appointmentA.getId() + "/order")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value(testService.getName()))
                .andReturn().getResponse().getContentAsString();

        UUID orderId = UUID.fromString(objectMapper.readTree(openResponse).get("id").asText());

        // 2. Adiciona um produto à comanda
        OrderItemAddDTO addItemDTO = new OrderItemAddDTO(OrderItemType.PRODUCT, testProduct.getId(), 2);
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/orders/" + orderId + "/items")
                        .header("Authorization", "Bearer " + professionalTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addItemDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));

        // 3. Define forma de pagamento e desconto
        OrderUpdateDTO updateDTO = new OrderUpdateDTO(new BigDecimal("10.00"), PaymentMethod.PIX);
        mockMvc.perform(patch("/api/v1/establishments/" + establishment.getId() + "/orders/" + orderId)
                        .header("Authorization", "Bearer " + professionalTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentMethod").value("PIX"))
                .andExpect(jsonPath("$.discountAmount").value(10.0));

        // 4. Finaliza a comanda
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/orders/" + orderId + "/finish")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        // Verifica se agendamento passou para DONE
        AppointmentEntity updatedAppointment = appointmentRepository.findById(appointmentA.getId()).orElseThrow();
        assertEquals(AppointmentStatus.DONE, updatedAppointment.getStatus());

        // 5. Tentar editar comanda após CLOSED deve retornar erro de negócio (400)
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/orders/" + orderId + "/items")
                        .header("Authorization", "Bearer " + professionalTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addItemDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Profissional B não pode acessar nem modificar comanda do Profissional A (403 Forbidden)")
    void testCrossProfessionalOrderForbidden() throws Exception {
        // Profissional A abre sua comanda
        String openResponse = mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/appointments/" + appointmentA.getId() + "/order")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        UUID orderId = UUID.fromString(objectMapper.readTree(openResponse).get("id").asText());

        // Profissional B tenta consultar a comanda de A -> 403
        mockMvc.perform(get("/api/v1/establishments/" + establishment.getId() + "/orders/" + orderId)
                        .header("Authorization", "Bearer " + professionalTokenB))
                .andExpect(status().isForbidden());

        // Profissional B tenta abrir a comanda do agendamento de A -> 403
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/appointments/" + appointmentA.getId() + "/order")
                        .header("Authorization", "Bearer " + professionalTokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cancelamento de agendamento cancela comanda OPEN")
    void testCancelAppointmentCancelsOpenOrder() throws Exception {
        // 1. Abre a comanda
        mockMvc.perform(post("/api/v1/establishments/" + establishment.getId() + "/appointments/" + appointmentA.getId() + "/order")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk());

        OrderEntity order = orderRepository.findByAppointmentId(appointmentA.getId()).orElseThrow();
        assertEquals(OrderStatus.OPEN, order.getStatus());

        // 2. Cancela o agendamento
        mockMvc.perform(patch("/api/v1/establishments/" + establishment.getId() + "/appointments/" + appointmentA.getId() + "/cancel")
                        .header("Authorization", "Bearer " + professionalTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // 3. Comanda deve estar cancelada
        OrderEntity cancelledOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());
    }
}
