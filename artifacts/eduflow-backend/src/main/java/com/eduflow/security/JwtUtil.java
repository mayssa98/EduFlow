package com.eduflow.security;

import com.eduflow.config.AppProperties;
import com.eduflow.model.entity.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final Duration accessExpiry;
    private final Duration refreshExpiry;

    public JwtUtil(AppProperties props) {
        this.accessKey = Keys.hmacShaKeyFor(normalize(props.getJwt().getAccessSecret()));
        this.refreshKey = Keys.hmacShaKeyFor(normalize(props.getJwt().getRefreshSecret()));
        this.accessExpiry = Duration.ofMinutes(props.getJwt().getAccessExpiryMinutes());
        this.refreshExpiry = Duration.ofDays(props.getJwt().getRefreshExpiryDays());
    }

    private byte[] normalize(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret is missing. Configure JWT_SECRET / JWT_REFRESH_SECRET (>= 32 bytes).");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT secret is too short (got " + bytes.length + " bytes, need >= 32).");
        }
        return bytes;
    }

    public String generateAccessToken(Long userId, String email, Role role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role.name())
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessExpiry)))
                .signWith(accessKey)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(refreshExpiry)))
                .signWith(refreshKey)
                .compact();
    }

    public String generatePreAuthToken(Long userId, String purpose) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", "preauth")
                .claim("purpose", purpose)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMinutes(15)))) // 15 minutes limit for 2FA or Registration
                .signWith(accessKey)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser().verifyWith(accessKey).build().parseSignedClaims(token).getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser().verifyWith(refreshKey).build().parseSignedClaims(token).getPayload();
    }

    public Claims parsePreAuthToken(String token) {
        return Jwts.parser().verifyWith(accessKey).build().parseSignedClaims(token).getPayload();
    }

    public Duration getAccessExpiry() { return accessExpiry; }
    public Duration getRefreshExpiry() { return refreshExpiry; }
}
