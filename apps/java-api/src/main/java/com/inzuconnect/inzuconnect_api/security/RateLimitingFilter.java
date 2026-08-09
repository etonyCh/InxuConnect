package com.inzuconnect.inzuconnect_api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int WINDOW_SECONDS = 60;
    private static final int MAX_REQUESTS_PER_WINDOW = 10;
    private static final int MAX_REQUESTS_AI_WINDOW = 40;

    private static final class Window {
        final Deque<Long> requests = new ArrayDeque<>();
    }

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        Predicate<String> rateLimited = p ->
                p.startsWith("/api/v1/auth") ||
                p.startsWith("/api/auth") ||
                p.startsWith("/api/ai") ||
                p.startsWith("/actuator/prometheus");

        boolean isAiPath = path.startsWith("/api/ai");
        int currentLimit = isAiPath ? MAX_REQUESTS_AI_WINDOW : MAX_REQUESTS_PER_WINDOW;

        if (rateLimited.test(path)) {
            String key = getClientIp(request) + "|" + path;
            long now = System.currentTimeMillis() / 1000L;
            Window window = buckets.computeIfAbsent(key, k -> new Window());

            synchronized (window) {
                long cutoff = now - WINDOW_SECONDS;
                while (!window.requests.isEmpty() && window.requests.peekFirst() < cutoff) {
                    window.requests.pollFirst();
                }
                if (window.requests.size() >= currentLimit) {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/problem+json;charset=UTF-8");
                    response.getWriter().write("{\"type\":\"about:blank\",\"title\":\"Too Many Requests\",\"status\":429,\"detail\":\"Trop de requêtes - réessayez dans une minute.\"}");
                    return;
                }
                window.requests.addLast(now);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
