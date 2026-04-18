package com.eduflow.service;

import com.eduflow.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final AppProperties props;
    private final RestClient http = RestClient.create();

    public EmailService(AppProperties props) {
        this.props = props;
    }

    public void sendOtpEmail(String to, String code, String purpose) {
        if (props.getEmail().getResendApiKey() == null || props.getEmail().getResendApiKey().isBlank()) {
            log.info("[DEV-OTP-DELIVERY] purpose={} to={} (code is delivered only via email; configure RESEND_API_KEY to receive it)", purpose, to);
        }
        String subject = purpose.equals("ACCOUNT_VERIFY")
                ? "EduFlow — Code de vérification"
                : "EduFlow — Réinitialisation du mot de passe";
        String body = "<div style='font-family:Inter,sans-serif;background:#0a0a14;color:#e2e8f0;padding:32px;border-radius:12px'>" +
                "<h2 style='color:#8b5cf6'>EduFlow</h2>" +
                "<p>Votre code de vérification :</p>" +
                "<p style='font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1'>" + code + "</p>" +
                "<p style='color:#94a3b8;font-size:13px'>Ce code expire dans " + props.getOtp().getExpiryMinutes() + " minutes.</p>" +
                "</div>";
                
        // PRINT THE OTP CODE TO CONSOLE FOR LOCAL TESTING
        log.info("==========================================================");
        log.info("DEVELOPMENT OTP CODE FOR {}: {}", to, code);
        log.info("==========================================================");
        
        send(to, subject, body);
    }

    private void send(String to, String subject, String html) {
        String apiKey = props.getEmail().getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[DEV-EMAIL] queued for delivery to {} (subject: {}). Configure RESEND_API_KEY to actually send.", to, subject);
            return;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        Map<String, Object> body = Map.of(
                "from", props.getEmail().getFromName() + " <" + props.getEmail().getFromAddress() + ">",
                "to", to,
                "subject", subject,
                "html", html
        );
        try {
            http.post()
                .uri("https://api.resend.com/emails")
                .headers(h -> h.addAll(headers))
                .body(body)
                .retrieve()
                .toBodilessEntity();
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
