package com.inzuconnect.inzuconnect_api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> lastResetTimes = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 10;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.contains("/api/v1/auth/login") || path.contains("/api/v1/auth/register")) {
            String clientIp = getClientIp(request);
            long currentTime = System.currentTimeMillis();

            lastResetTimes.putIfAbsent(clientIp, currentTime);
            requestCounts.putIfAbsent(clientIp, 0);

            if (currentTime - lastResetTimes.get(clientIp) > 60000) {
                lastResetTimes.put(clientIp, currentTime);
                requestCounts.put(clientIp, 0);
            }

            int count = requestCounts.get(clientIp) + 1;
            requestCounts.put(clientIp, count);

            if (count > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"OWASP Security: Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
