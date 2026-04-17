package com.eduflow.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtil jwtUtil;
    private final CookieUtil cookieUtil;

    public JwtAuthFilter(JwtUtil jwtUtil, CookieUtil cookieUtil) {
        this.jwtUtil = jwtUtil;
        this.cookieUtil = cookieUtil;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse resp,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String token = cookieUtil.readCookie(req, CookieUtil.ACCESS_COOKIE);
        if (token == null) {
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) token = header.substring(7);
        }
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtUtil.parseAccessToken(token);
                String role = claims.get("role", String.class);
                Long userId = Long.parseLong(claims.getSubject());
                String email = claims.get("email", String.class);
                var auth = new UsernamePasswordAuthenticationToken(
                        new AuthPrincipal(userId, email, role),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                log.debug("Invalid JWT: {}", e.getMessage());
            }
        }
        chain.doFilter(req, resp);
    }

    public record AuthPrincipal(Long userId, String email, String role) {}
}
