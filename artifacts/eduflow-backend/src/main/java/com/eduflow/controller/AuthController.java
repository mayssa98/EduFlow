package com.eduflow.controller;

import com.eduflow.model.dto.AuthDtos.*;
import com.eduflow.security.CookieUtil;
import com.eduflow.security.JwtAuthFilter;
import com.eduflow.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    public AuthController(AuthService authService, CookieUtil cookieUtil) {
        this.authService = authService;
        this.cookieUtil = cookieUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<SimpleMessageResponse> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok(new SimpleMessageResponse(
                "Account created. A verification code has been sent to your email."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthUserResponse> verify(@Valid @RequestBody OtpVerifyRequest req,
                                                   HttpServletResponse resp) {
        return ResponseEntity.ok(authService.verifyOtp(req, resp));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest req,
                                                  HttpServletResponse resp) {
        return ResponseEntity.ok(authService.login(req, resp));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthUserResponse> google(@Valid @RequestBody GoogleAuthRequest req,
                                                   HttpServletResponse resp) {
        return ResponseEntity.ok(authService.loginWithGoogle(req, resp));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthUserResponse> refresh(HttpServletRequest req, HttpServletResponse resp) {
        String token = cookieUtil.readCookie(req, CookieUtil.REFRESH_COOKIE);
        return ResponseEntity.ok(authService.refresh(token, resp));
    }

    @PostMapping("/logout")
    public ResponseEntity<SimpleMessageResponse> logout(HttpServletRequest req,
                                                        HttpServletResponse resp,
                                                        @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        String refresh = cookieUtil.readCookie(req, CookieUtil.REFRESH_COOKIE);
        Long userId = principal != null ? principal.userId() : null;
        authService.logout(refresh, userId, resp);
        return ResponseEntity.ok(new SimpleMessageResponse("Logged out"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<SimpleMessageResponse> forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(new SimpleMessageResponse(
                "If an account exists for this email, a reset code has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<SimpleMessageResponse> reset(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(new SimpleMessageResponse("Password updated. Please log in."));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.currentUser(principal.userId()));
    }
}
