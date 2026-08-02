package com.inzuconnect.inzuconnect_api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${inzuconnect.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public OpenAPI inzuconnectOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        String firstOrigin = allowedOrigins.split(",")[0];

        return new OpenAPI()
                .info(new Info()
                        .title("InzuConnect API")
                        .description("Plateforme de réservation de logements au Burundi — REST API. " +
                                "Authentification JWT, listings, réservations, KYC, paiements Mobile Money, " +
                                "staging virtuel IA et assistant vocal bilingue (Français / Kirundi).")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("InzuConnect Support")
                                .email("support@inzuconnect.bi")
                                .url("https://inzuconnect.bi"))
                        .license(new License()
                                .name("Proprietary — InzuConnect SARL")
                                .url("https://inzuconnect.bi/terms")))
                .servers(List.of(
                        new Server()
                                .url(firstOrigin.contains("4200") ? "http://localhost:8080" : firstOrigin)
                                .description("API principale InzuConnect")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT obtenu via /api/auth/login ou /api/auth/register")));
    }
}
