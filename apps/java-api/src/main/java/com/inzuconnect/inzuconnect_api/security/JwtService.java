package com.inzuconnect.inzuconnect_api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${inzuconnect.security.jwt.secret}")
    private String secretKey;

    @Value("${inzuconnect.security.jwt.expiration-ms:604800000}")
    private long expirationMs;

    @Value("${inzuconnect.security.jwt.refresh-expiration-ms:2592000000}")
    private long refreshExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).get("email", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractAllClaims(token).getExpiration().before(new Date());
        } catch (SignatureException | io.jsonwebtoken.ExpiredJwtException e) {
            return true;
        }
    }

    public String generateToken(com.inzuconnect.inzuconnect_api.domain.User user) {
        return Jwts.builder()
                .setSubject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("badge", user.getBadge().name())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(com.inzuconnect.inzuconnect_api.domain.User user) {
        return Jwts.builder()
                .setSubject(user.getId())
                .claim("type", "refresh")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(getSigningKey(), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
