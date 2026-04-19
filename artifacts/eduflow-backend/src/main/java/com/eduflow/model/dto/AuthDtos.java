package com.eduflow.model.dto;

import com.eduflow.model.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 8, max = 128)
            @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                     message = "Password must contain at least one uppercase letter, one digit, and one special character")
            String password,
            @NotBlank @Size(max = 120) String nom,
            @NotBlank @Size(max = 120) String prenom,
            @NotNull @Positive Integer age,
            @NotBlank @Size(max = 255) String adresse,
            @NotNull Role role
    ) {}

    public record OtpVerifyRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "^\\d{6}$") String code
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank @Email String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "^\\d{6}$") String code,
            @NotBlank @Size(min = 8, max = 128)
            @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$")
            String newPassword
    ) {}

    public record GoogleAuthRequest(
            @NotBlank String code,
            String redirectUri
    ) {}

    public record GoogleOAuthConfigResponse(
            String clientId,
            String redirectUri
    ) {}

    public record AuthUserResponse(
            Long id,
            String email,
            String nom,
            String prenom,
            Role role,
            String statutCompte,
            String photoUrl,
            Boolean onboardingCompleted
    ) {}

    public record MfaChallengeResponse(
            boolean mfaRequired,
            String ticket,
            List<String> availableMethods
    ) {}

    public record VerifyMfaRequest(
            @NotBlank String ticket,
            @NotBlank String code
    ) {}

    public record GoogleCompleteRequest(
            @NotBlank String registerTicket,
            String optionalPassword // Le mot de passe est optionnel
    ) {}

    public record GoogleRegistrationChallenge(
            boolean requiresRegistration,
            String registerTicket,
            String email,
            String nom,
            String prenom,
            String photoUrl
    ) {}

    public record SimpleMessageResponse(String message) {}
}
