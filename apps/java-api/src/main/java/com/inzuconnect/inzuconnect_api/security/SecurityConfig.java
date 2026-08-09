package com.inzuconnect.inzuconnect_api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.util.ContentCachingRequestWrapper;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    @Value("${inzuconnect.cors.allowed-origins}")
    private String allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, RateLimitingFilter rateLimitingFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean
    public Filter contentCachingRequestFilter() {
        return (ServletRequest request, ServletResponse response, FilterChain chain) -> {
            if (request instanceof HttpServletRequest httpRequest) {
                ContentCachingRequestWrapper wrapped = new ContentCachingRequestWrapper(httpRequest, 1024 * 1024);
                chain.doFilter(wrapped, response);
            } else {
                chain.doFilter(request, response);
            }
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(contentType -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                    .preload(true)
                )
                .addHeaderWriter(new StaticHeadersWriter("X-Content-Type-Options", "nosniff"))
                .addHeaderWriter(new StaticHeadersWriter("X-XSS-Protection", "1; mode=block"))
                .addHeaderWriter(new StaticHeadersWriter("Referrer-Policy", "strict-origin-when-cross-origin"))
                .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()"))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/v1/auth/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/listings", "/api/listings/*", "/api/listings/*/services", "/api/v1/listings/search", "/api/v1/listings/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/*/reviews").permitAll()
                .requestMatchers("/api/admin/**", "/api/v1/admin/**").hasAnyRole("ADMIN", "B2B")
                .requestMatchers("/api/health", "/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/api/ai/**").permitAll()
                .requestMatchers("/actuator/info").permitAll()
                .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/kyc/webhook", "/api/payments/mock-callback").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(contentCachingRequestFilter(), org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitingFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = List.of(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "X-XSRF-TOKEN", "X-CSRF-TOKEN"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type", "X-Total-Count", "X-Page", "X-Limit"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        /*
         * OWASP recommended password hashing (Argon2id v=19, PHC winner 2015), with
         * a Spring DelegatingPasswordEncoder so EXISTING BCrypt-hashed rows continue
         * to verify WITHOUT downtime during a gradual migration.
         *
         * New encodes use the default encoder id \"argon2\" → produce:
         *      {argon2}$argon2id$v=19$m=19456,t=2,p=1$<b64salt>$<b64hash>
         * Old rows prefixed with \"{bcrypt}\" still match the bcrypt delegate; rows
         * without any prefix fall through to bcrypt fallback (for legacy data that
         * pre-dates the prefix scheme).
         *
         * Argon2id parameters target ~300 ms on a single core in Docker:
         *   saltLength  = 16 bytes  (128 bits, NIST minimum)
         *   hashLength  = 32 bytes  (256 bits, SHA-256 equivalent)
         *   parallelism = 1         (single lane = 2 threads in Bouncy Castle)
         *   memory      = 19456 KB  (~19 MB, OWASP ASVS 2024 minimum for interactive)
         *   iterations  = 2
         *
         * BCrypt delegate keeps cost=12 (the prior production cost).
         *
         * Bouncy Castle provider (bcprov-jdk18on) is required by
         * Argon2PasswordEncoder; it auto-registers via META-INF/services SPI loader.
         */
        String defaultEncoderId = "argon2";
        java.util.Map<String, PasswordEncoder> encoders = new java.util.HashMap<>();
        encoders.put(defaultEncoderId, new Argon2PasswordEncoder(16, 32, 1, 19456, 2));
        encoders.put("bcrypt", new BCryptPasswordEncoder(12));
        DelegatingPasswordEncoder delegate = new DelegatingPasswordEncoder(defaultEncoderId, encoders);
        delegate.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder(12));
        return delegate;
    }
}
