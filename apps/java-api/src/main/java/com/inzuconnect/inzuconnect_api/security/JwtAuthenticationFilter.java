package com.inzuconnect.inzuconnect_api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);

            if (!jwtService.isTokenValid(jwt)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/problem+json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("""
                        {"type":"https://inzuconnect.bi/problem/unauthorized",\
                        "title":"Token invalide ou expiré",\
                        "status":401,\
                        "detail":"Veuillez vous reconnecter."}""");
                return;
            }

            final String userId = jwtService.extractUserId(jwt);
            final String role = jwtService.extractRole(jwt);
            final String email = jwtService.extractEmail(jwt);

            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String principal = email != null && !email.isBlank() ? email : userId;
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            if (response.isCommitted()) {
                filterChain.doFilter(request, response);
                return;
            }
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/problem+json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("""
                    {"type":"https://inzuconnect.bi/problem/unauthorized",\
                    "title":"Jeton d'authentification invalide",\
                    "status":401,\
                    "detail":"%s"}""".formatted(e.getMessage() != null ? e.getMessage() : "Jeton malformé."));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
