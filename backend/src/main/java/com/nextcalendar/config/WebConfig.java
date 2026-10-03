package com.nextcalendar.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:8081",
                        "http://localhost:8082",
                        "http://localhost:8085",
                        "http://localhost:19000",
                        "http://localhost:19001",
                        "http://localhost:19006",
                        "http://127.0.0.1:8081",
                        "http://127.0.0.1:8085",
                        "http://127.0.0.1:19000",
                        "http://127.0.0.1:19006",
                        "http://10.0.2.2:8081",
                        "http://10.0.2.2:19000"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
