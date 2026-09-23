package com.nextcalendar.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    /**
     * Enquanto o projeto utiliza ddl-auto=update (Hibernate gerenciando o schema),
     * as tabelas ainda não existem no momento padrão em que o Flyway executa
     * (antes do EntityManagerFactory ser inicializado).
     *
     * Esta estratégia substitui a migração pré-JPA por um no-op, permitindo que o Hibernate
     * crie as tabelas primeiro.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // No-op na fase de inicialização pré-JPA
        };
    }

    /**
     * Executa as migrations do Flyway imediatamente após a inicialização da aplicação
     * (e portanto após o Hibernate ter criado as tabelas via ddl-auto=update).
     */
    @Bean
    public ApplicationRunner runFlywayAfterHibernate(Flyway flyway) {
        return args -> flyway.migrate();
    }
}
