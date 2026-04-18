package com.eduflow.service;

import com.eduflow.config.AppProperties;
import com.eduflow.util.EmailNormalizer;
import com.eduflow.util.HashUtil;
import org.springframework.security.authentication.BadCredentialsException;
import com.eduflow.model.dto.AuthDtos.*;
import com.eduflow.model.entity.*;
import com.eduflow.model.entity.enums.OtpPurpose;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.repository.*;
import com.eduflow.security.CookieUtil;
import com.eduflow.security.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UtilisateurRepository userRepo;
    private final OtpCodeRepository otpRepo;
    private final RefreshTokenRepository refreshRepo;
    private final EmailService emailService;
    private final GoogleOAuthService googleService;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final CookieUtil cookieUtil;
    private final AppProperties props;

    public AuthService(UtilisateurRepository userRepo,
                       OtpCodeRepository otpRepo,
                       RefreshTokenRepository refreshRepo,
                       EmailService emailService,
                       GoogleOAuthService googleService,
                       PasswordEncoder encoder,
                       JwtUtil jwtUtil,
                       CookieUtil cookieUtil,
                       AppProperties props) {
        this.userRepo = userRepo;
        this.otpRepo = otpRepo;
        this.refreshRepo = refreshRepo;
        this.emailService = emailService;
        this.googleService = googleService;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.cookieUtil = cookieUtil;
        this.props = props;
    }

    @Transactional
    public void register(RegisterRequest req) {
        if (req.email().contains("+")) {
            throw new IllegalArgumentException("Email cannot contain '+' character");
        }
        String normalized = EmailNormalizer.normalize(req.email());
        Optional<Utilisateur> optUser = userRepo.findByEmailNormalized(normalized);
        
        Utilisateur user;
        if (optUser.isPresent()) {
            user = optUser.get();
            if (user.getStatutCompte() != StatutCompte.PENDING) {
                throw new IllegalStateException("Email already registered");
            }
            // User is still pending. We will just update their info and resend the OTP!
            user.setNom(req.nom().trim());
            user.setPrenom(req.prenom().trim());
            user.setMotDePasseHash(encoder.encode(req.password()));
        } else {
            user = switch (req.role()) {
                case ADMIN -> throw new IllegalArgumentException("Admin self-registration is not allowed");
                case ENSEIGNANT -> {
                    Enseignant e = new Enseignant();
                    e.setStatutCompte(StatutCompte.PENDING);
                    yield e;
                }
                case ETUDIANT -> {
                    Etudiant s = new Etudiant();
                    s.setStatutCompte(StatutCompte.PENDING);
                    yield s;
                }
            };
            user.setEmail(req.email().trim().toLowerCase());
            user.setEmailNormalized(normalized);
            user.setNom(req.nom().trim());
            user.setPrenom(req.prenom().trim());
            user.setRole(req.role());
            user.setMotDePasseHash(encoder.encode(req.password()));
        }
        
        userRepo.save(user);

        issueOtp(user, OtpPurpose.ACCOUNT_VERIFY);
    }

    @Transactional
    public AuthUserResponse verifyOtp(OtpVerifyRequest req, HttpServletResponse resp) {
        Utilisateur user = userRepo.findByEmailNormalized(EmailNormalizer.normalize(req.email()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid OTP"));
        OtpCode otp = consumeOtp(user, req.code(), OtpPurpose.ACCOUNT_VERIFY);
        // Email verified — teachers go to PENDING_APPROVAL until an admin reviews,
        // others are activated. We still don't issue session tokens for teachers
        // until they are approved.
        user.setNbTentativesLogin(0);
        if (user.getRole() == com.eduflow.model.entity.enums.Role.ENSEIGNANT) {
            user.setStatutCompte(StatutCompte.PENDING_APPROVAL);
            userRepo.save(user);
            otpRepo.save(otp);
            return toResponse(user);
        }
        user.setStatutCompte(StatutCompte.ACTIVE);
        userRepo.save(user);
        otpRepo.save(otp);

        issueTokens(user, resp);
        return toResponse(user);
    }

    @Transactional
    public Object login(LoginRequest req, HttpServletResponse resp) {
        String normalized = EmailNormalizer.normalize(req.email());
        Utilisateur user = userRepo.findByEmailNormalized(normalized)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        // Verify password BEFORE leaking any account-state information.
        if (user.getMotDePasseHash() == null || !encoder.matches(req.password(), user.getMotDePasseHash())) {
            user.setNbTentativesLogin(user.getNbTentativesLogin() + 1);
            if (user.getNbTentativesLogin() >= props.getLogin().getMaxAttempts()) {
                user.setStatutCompte(StatutCompte.BLOCKED);
            }
            userRepo.save(user);
            throw new IllegalArgumentException("Invalid credentials");
        }
        if (user.getStatutCompte() == StatutCompte.BLOCKED) {
            throw new IllegalStateException("Account is blocked");
        }
        if (user.getStatutCompte() == StatutCompte.PENDING) {
            throw new IllegalStateException("Account not verified");
        }
        if (user.getStatutCompte() == StatutCompte.PENDING_APPROVAL) {
            throw new IllegalStateException("Account awaiting admin approval");
        }
        user.setNbTentativesLogin(0);
        user.setDerniereConnexion(OffsetDateTime.now());
        
        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            if (user.getMfaLockoutUntil() != null && user.getMfaLockoutUntil().isAfter(OffsetDateTime.now())) {
                throw new IllegalStateException("2FA session locked. Try again later.");
            }
            if (user.getMfaMethod() == com.eduflow.model.entity.enums.TwoFactorMethod.EMAIL) {
                issueOtp(user, OtpPurpose.TWO_FACTOR);
            }
            userRepo.save(user);
            String ticket = jwtUtil.generatePreAuthToken(user.getId(), "2FA");
            return new MfaChallengeResponse(true, ticket, java.util.List.of(user.getMfaMethod().name()));
        }
        
        userRepo.save(user);
        issueTokens(user, resp);
        return toResponse(user);
    }
    
    @Transactional
    public AuthUserResponse verify2fa(VerifyMfaRequest req, HttpServletResponse resp) {
        Claims claims;
        try {
            claims = jwtUtil.parsePreAuthToken(req.ticket());
        } catch (Exception e) {
            throw new IllegalArgumentException("Session expired or invalid");
        }
        if (!"2FA".equals(claims.get("purpose"))) {
            throw new IllegalArgumentException("Invalid ticket purpose");
        }
        
        Long userId = Long.parseLong(claims.getSubject());
        Utilisateur user = userRepo.findById(userId).orElseThrow(() -> new IllegalStateException("User context lost"));
        
        if (user.getMfaLockoutUntil() != null && user.getMfaLockoutUntil().isAfter(OffsetDateTime.now())) {
            throw new IllegalStateException("2FA locked.");
        }
        
        if (user.getMfaMethod() == com.eduflow.model.entity.enums.TwoFactorMethod.EMAIL) {
            try {
                OtpCode otp = consumeOtp(user, req.code(), OtpPurpose.TWO_FACTOR);
                otpRepo.save(otp);
            } catch (Exception e) {
                user.setMfaFailedAttempts(user.getMfaFailedAttempts() + 1);
                if (user.getMfaFailedAttempts() >= 3) {
                    user.setMfaLockoutUntil(OffsetDateTime.now().plusMinutes(15));
                    user.setMfaFailedAttempts(0);
                }
                userRepo.save(user);
                throw e; // rethrow invalid code
            }
        } else if (user.getMfaMethod() == com.eduflow.model.entity.enums.TwoFactorMethod.TOTP) {
            // Placeholder pour la logique TOTP (Google Authenticator)
        } else if (user.getMfaMethod() == com.eduflow.model.entity.enums.TwoFactorMethod.WEBAUTHN) {
             // Placeholder pour la logique WebAuthn
        }

        user.setMfaFailedAttempts(0);
        userRepo.save(user);
        issueTokens(user, resp);
        return toResponse(user);
    }

    @Transactional
    public Object loginWithGoogle(GoogleAuthRequest req, HttpServletResponse resp) {
        var profile = googleService.exchangeCode(req.code(), req.redirectUri());
        
        Optional<Utilisateur> optUser = userRepo.findByGoogleSubject(profile.sub())
                .or(() -> userRepo.findByEmailNormalized(EmailNormalizer.normalize(profile.email())));
        
        if (optUser.isEmpty()) {
            // Nouveau compte : On l'enregistre temporairement sans session, et on lance un challenge Optionnel
            Etudiant s = new Etudiant();
            s.setEmail(profile.email().toLowerCase());
            s.setEmailNormalized(EmailNormalizer.normalize(profile.email()));
            s.setNom(profile.familyName());
            s.setPrenom(profile.givenName());
            s.setRole(Role.ETUDIANT);
            s.setStatutCompte(StatutCompte.ACTIVE);
            s.setGoogleSubject(profile.sub());
            if (profile.picture() != null) s.setPhotoUrl(profile.picture());
            userRepo.save(s);
            
            String ticket = jwtUtil.generatePreAuthToken(s.getId(), "GOOGLE_REG");
            return new GoogleRegistrationChallenge(true, ticket, s.getEmail(), s.getNom(), s.getPrenom(), s.getPhotoUrl());
        }

        Utilisateur user = optUser.get();
        user.setGoogleSubject(profile.sub());
        if (profile.picture() != null) user.setPhotoUrl(profile.picture());
        
        // Check blocks and validations
        if (user.getStatutCompte() == StatutCompte.BLOCKED) {
            throw new BadCredentialsException("Account is blocked");
        }
        if (user.getStatutCompte() == StatutCompte.PENDING_APPROVAL) {
            userRepo.save(user);
            throw new BadCredentialsException("Teacher account awaiting admin approval");
        }
        if (user.getStatutCompte() == StatutCompte.PENDING) {
            user.setStatutCompte(StatutCompte.ACTIVE);
        }
        if (user.getStatutCompte() != StatutCompte.ACTIVE) {
            throw new BadCredentialsException("Account not active");
        }
        
        user.setDerniereConnexion(OffsetDateTime.now());
        userRepo.save(user);
        issueTokens(user, resp);
        return toResponse(user);
    }
    
    @Transactional
    public AuthUserResponse completeGoogleRegistration(GoogleCompleteRequest req, HttpServletResponse resp) {
        Claims claims;
        try {
            claims = jwtUtil.parsePreAuthToken(req.registerTicket());
        } catch (Exception e) {
            throw new IllegalArgumentException("Registration timeout. Please login via Google again.");
        }
        if (!"GOOGLE_REG".equals(claims.get("purpose"))) {
            throw new IllegalArgumentException("Invalid ticket");
        }
        
        Long userId = Long.parseLong(claims.getSubject());
        Utilisateur user = userRepo.findById(userId).orElseThrow(() -> new IllegalStateException("User context lost"));
        
        if (req.optionalPassword() != null && !req.optionalPassword().isBlank()) {
            user.setMotDePasseHash(encoder.encode(req.optionalPassword()));
        }
        
        user.setDerniereConnexion(OffsetDateTime.now());
        userRepo.save(user);
        issueTokens(user, resp);
        return toResponse(user);
    }

    @Transactional
    public void logout(String refreshTokenValue, Long userId, HttpServletResponse resp) {
        cookieUtil.clearAuthCookies(resp);
        if (refreshTokenValue != null) {
            String hash = HashUtil.sha256(refreshTokenValue);
            refreshRepo.findByTokenHash(hash).ifPresent(t -> { t.setRevoked(true); refreshRepo.save(t); });
        }
        if (userId != null) {
            refreshRepo.revokeAllForUser(userId);
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        String normalized = EmailNormalizer.normalize(req.email());
        userRepo.findByEmailNormalized(normalized).ifPresent(u -> {
            try {
                issueOtp(u, OtpPurpose.PASSWORD_RESET);
            } catch (Exception e) {
                log.warn("Failed to issue password reset OTP: {}", e.getMessage());
            }
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        Utilisateur user = userRepo.findByEmailNormalized(EmailNormalizer.normalize(req.email()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid request"));
        OtpCode otp = consumeOtp(user, req.code(), OtpPurpose.PASSWORD_RESET);
        user.setMotDePasseHash(encoder.encode(req.newPassword()));
        user.setNbTentativesLogin(0);
        if (user.getStatutCompte() == StatutCompte.BLOCKED) user.setStatutCompte(StatutCompte.ACTIVE);
        userRepo.save(user);
        otpRepo.save(otp);
        refreshRepo.revokeAllForUser(user.getId());
    }

    @Transactional
    public AuthUserResponse refresh(String refreshTokenValue, HttpServletResponse resp) {
        if (refreshTokenValue == null) throw new IllegalArgumentException("Missing refresh token");
        Claims claims;
        try {
            claims = jwtUtil.parseRefreshToken(refreshTokenValue);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        Long userId = Long.parseLong(claims.getSubject());
        String hash = HashUtil.sha256(refreshTokenValue);
        RefreshToken stored = refreshRepo.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not recognized"));
        if (Boolean.TRUE.equals(stored.getRevoked()) || stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }
        Utilisateur user = userRepo.findById(userId)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("User not found"));
        stored.setRevoked(true);
        refreshRepo.save(stored);
        issueTokens(user, resp);
        return toResponse(user);
    }

    public AuthUserResponse currentUser(Long userId) {
        Utilisateur user = userRepo.findById(userId)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("User not found"));
        return toResponse(user);
    }

    // --- helpers ---

    private void issueOtp(Utilisateur user, OtpPurpose purpose) {
        Optional<OtpCode> existing = otpRepo.findFirstByUtilisateurIdAndPurposeAndConsumedAtIsNullOrderByDateCreationDesc(
                user.getId(), purpose);
        existing.ifPresent(o -> { o.setConsumedAt(OffsetDateTime.now()); otpRepo.save(o); });
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpCode otp = new OtpCode();
        otp.setUtilisateur(user);
        otp.setPurpose(purpose);
        otp.setCodeHash(encoder.encode(code));
        otp.setMaxAttempts(props.getOtp().getMaxAttempts());
        otp.setExpiresAt(OffsetDateTime.now().plusMinutes(props.getOtp().getExpiryMinutes()));
        otpRepo.save(otp);
        emailService.sendOtpEmail(user.getEmail(), code, purpose.name());
    }

    private OtpCode consumeOtp(Utilisateur user, String code, OtpPurpose purpose) {
        OtpCode otp = otpRepo.findFirstByUtilisateurIdAndPurposeAndConsumedAtIsNullOrderByDateCreationDesc(
                        user.getId(), purpose)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired code"));
        if (otp.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Code expired");
        }
        if (otp.getAttempts() >= otp.getMaxAttempts()) {
            throw new IllegalArgumentException("Too many attempts");
        }
        otp.setAttempts(otp.getAttempts() + 1);
        if (!encoder.matches(code, otp.getCodeHash())) {
            otpRepo.save(otp);
            throw new IllegalArgumentException("Invalid code");
        }
        otp.setConsumedAt(OffsetDateTime.now());
        return otp;
    }

    private void issueTokens(Utilisateur user, HttpServletResponse resp) {
        String access = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refresh = jwtUtil.generateRefreshToken(user.getId());
        RefreshToken rt = new RefreshToken();
        rt.setUtilisateur(user);
        rt.setTokenHash(HashUtil.sha256(refresh));
        rt.setExpiresAt(OffsetDateTime.now().plus(jwtUtil.getRefreshExpiry()));
        refreshRepo.save(rt);
        cookieUtil.writeAccessCookie(resp, access, jwtUtil.getAccessExpiry());
        cookieUtil.writeRefreshCookie(resp, refresh, jwtUtil.getRefreshExpiry());
    }

    private AuthUserResponse toResponse(Utilisateur u) {
        return new AuthUserResponse(u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getRole(), u.getStatutCompte().name(), u.getPhotoUrl());
    }
}
