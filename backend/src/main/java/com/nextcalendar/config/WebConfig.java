package com.nextcalendar.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
<<<<<<< HEAD
                .allowedOriginPatterns("*") // permite emulador Android (10.0.2.2), Expo Go e web
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
=======
                .allowedOrigins(
                        "http://localhost:8081",  // Expo Web padrão
                        "http://localhost:8085",  // frontend-barbearia
                        "http://localhost:19006"  // Expo Web alternativo
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT")
>>>>>>> db442ab9d0d608e81faf87a91b8d8dbbf187030f
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
