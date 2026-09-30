package com.nextcalendar.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;



@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable()) // necessário para o H2 Console
                )
                .authorizeHttpRequests(auth -> auth
                        // Rotas públicas
                        .requestMatchers(
                                "/api/v1/auth/**",   // login e registro
                                "/h2-console/**",    // console do banco em dev
                                "/swagger-ui/**",    // Swagger UI
                                "/v3/api-docs/**"    // OpenAPI docs
                        ).permitAll()
                        // Todas as outras requerem autenticação
                        // (por enquanto, permitAll temporário até o filtro JWT estar completo)
                        .anyRequest().permitAll()
                );

        return http.build();
    }


}
