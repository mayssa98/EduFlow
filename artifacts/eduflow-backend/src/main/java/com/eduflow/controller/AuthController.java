package com.eduflow.controller;

import com.eduflow.model.dto.AuthDtos.*;
import com.eduflow.security.CookieUtil;
import com.eduflow.security.JwtAuthFilter;
import com.eduflow.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Registration, OTP verification, login (password + Google), refresh, logout, password reset")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials, OTP, or refresh token")
})
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    public AuthController(AuthService authService, CookieUtil cookieUtil) {
        this.authService = authService;
        this.cookieUtil = cookieUtil;
    }

    @Operation(summary = "Create a pending account and email an OTP code")
    @PostMapping("/register")
    public ResponseEntity<SimpleMessageResponse> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok(new SimpleMessageResponse(
                "Account created. A verification code has been sent to your email."));
    }

    @Operation(summary = "Verify the OTP; activates students and issues JWT cookies (teachers wait for admin approval)")
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthUserResponse> verify(@Valid @RequestBody OtpVerifyRequest req,
                                                   HttpServletResponse resp) {
        return ResponseEntity.ok(authService.verifyOtp(req, resp));
    }

    @Operation(summary = "Email + password login; sets HttpOnly access/refresh cookies")
    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest req,
                                                  HttpServletResponse resp) {
        return ResponseEntity.ok(authService.login(req, resp));
    }

    @Operation(summary = "Google OAuth ID-token sign-in; creates the account on first use")
    @PostMapping("/google")
    public ResponseEntity<AuthUserResponse> google(@Valid @RequestBody GoogleAuthRequest req,
                                                   HttpServletResponse resp) {
        return ResponseEntity.ok(authService.loginWithGoogle(req, resp));
    }

    @Operation(summary = "Rotate the access token using the refresh cookie")
    @PostMapping("/refresh")
    public ResponseEntity<AuthUserResponse> refresh(HttpServletRequest req, HttpServletResponse resp) {
        String token = cookieUtil.readCookie(req, CookieUtil.REFRESH_COOKIE);
        return ResponseEntity.ok(authService.refresh(token, resp));
    }

    @Operation(summary = "Revoke the refresh token and clear auth cookies")
    @PostMapping("/logout")
    public ResponseEntity<SimpleMessageResponse> logout(HttpServletRequest req,
                                                        HttpServletResponse resp,
                                                        @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        String refresh = cookieUtil.readCookie(req, CookieUtil.REFRESH_COOKIE);
        Long userId = principal != null ? principal.userId() : null;
        authService.logout(refresh, userId, resp);
        return ResponseEntity.ok(new SimpleMessageResponse("Logged out"));
    }

    @Operation(summary = "Email a password-reset OTP if the account exists (always returns 200)")
    @PostMapping("/forgot-password")
    public ResponseEntity<SimpleMessageResponse> forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(new SimpleMessageResponse(
                "If an account exists for this email, a reset code has been sent."));
    }

    @Operation(summary = "Reset the password using the OTP from forgot-password")
    @PostMapping("/reset-password")
    public ResponseEntity<SimpleMessageResponse> reset(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(new SimpleMessageResponse("Password updated. Please log in."));
    }

    @Operation(summary = "Return the currently authenticated user (401 if no valid access cookie)")
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.currentUser(principal.userId()));
    }
}
