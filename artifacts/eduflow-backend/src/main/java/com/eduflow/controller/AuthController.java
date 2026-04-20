package com.eduflow.controller;

import com.eduflow.model.dto.AuthDtos.*;
import com.eduflow.config.AppProperties;
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
    private final AppProperties props;

    public AuthController(AuthService authService, CookieUtil cookieUtil, AppProperties props) {
        this.authService = authService;
        this.cookieUtil = cookieUtil;
        this.props = props;
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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletResponse resp) {
        return ResponseEntity.ok(authService.login(req, resp));
    }

    @Operation(summary = "Verify the 2FA code if a challenge was returned during login")
    @PostMapping("/verify-2fa")
    public ResponseEntity<AuthUserResponse> verify2fa(@Valid @RequestBody VerifyMfaRequest req,
                                                      HttpServletResponse resp) {
        return ResponseEntity.ok(authService.verify2fa(req, resp));
    }

    @Operation(summary = "Google OAuth ID-token sign-in; creates the account on first use")
    @PostMapping("/google")
    public ResponseEntity<?> google(@Valid @RequestBody GoogleAuthRequest req,
                                    HttpServletResponse resp) {
        return ResponseEntity.ok(authService.loginWithGoogle(req, resp));
    }

    @Operation(summary = "Complete Google OAuth registration with an optional password")
    @PostMapping("/google/complete")
    public ResponseEntity<AuthUserResponse> googleComplete(@Valid @RequestBody GoogleCompleteRequest req,
                                                           HttpServletResponse resp) {
        return ResponseEntity.ok(authService.completeGoogleRegistration(req, resp));
    }

    @Operation(summary = "Return safe Google OAuth client configuration for frontend authorization redirect")
    @GetMapping("/google/config")
    public ResponseEntity<GoogleOAuthConfigResponse> googleConfig() {
        String clientId = props.getGoogle().getClientId();
        String redirectUri = props.getGoogle().getRedirectUri();
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("Google OAuth is not configured");
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new IllegalStateException("Google redirect URI is not configured");
        }
        return ResponseEntity.ok(new GoogleOAuthConfigResponse(clientId, redirectUri));
    }

    @Operation(summary = "Rotate the access token using the refresh cookie")
    @PostMapping("/refresh")
    public ResponseEntity<AuthUserResponse> refresh(HttpServletRequest req, HttpServletResponse resp) {
        String token = cookieUtil.readCookie(req, CookieUtil.REFRESH_COOKIE);
        return ResponseEntity.ok(authService.refresh(token, resp));
    }

    @Operation(summary = "Revoke the refresh token and clear auth cookies (idempotent — always clears cookies)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req,
                                       HttpServletResponse resp,
                                       @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        String refresh = cookieUtil.readCookie(req, CookieUtil.REFRESH_COOKIE);
        Long userId = principal != null ? principal.userId() : null;
        // Idempotent: always clear cookies even if token is already invalid/expired
        authService.logout(refresh, userId, resp);
        return ResponseEntity.noContent().build(); // 204 Déconnecté
    }

    @Operation(summary = "Email a password-reset OTP if the account exists")
    @PostMapping("/forgot-password")
    public ResponseEntity<SimpleMessageResponse> forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(new SimpleMessageResponse(
                "A reset code has been sent to your email."));
    }

    @Operation(summary = "Reset the password using the OTP from forgot-password")
    @PostMapping("/reset-password")
    public ResponseEntity<SimpleMessageResponse> reset(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(new SimpleMessageResponse("Password updated. Please log in."));
    }

    @Operation(summary = "Validate the password-reset OTP before letting the user set a new password")
    @PostMapping("/verify-reset-otp")
    public ResponseEntity<SimpleMessageResponse> verifyResetOtp(@Valid @RequestBody VerifyResetOtpRequest req) {
        authService.verifyResetOtp(req);
        return ResponseEntity.ok(new SimpleMessageResponse("OTP verified."));
    }

    @Operation(summary = "Return the currently authenticated user (401 if no valid access cookie)")
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.currentUser(principal.userId()));
    }
}
