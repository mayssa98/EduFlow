package com.eduflow.service;

import com.eduflow.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Locale;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final AppProperties props;
    private final JavaMailSender mailSender;
    private final RestClient http = RestClient.create();

    public EmailService(AppProperties props, JavaMailSender mailSender) {
        this.props = props;
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String to, String code, String purpose) {
        String subject = purpose.equals("ACCOUNT_VERIFY")
                ? "EduFlow - Code de verification"
                : "EduFlow - Reinitialisation du mot de passe";
        String body = "<div style='font-family:Inter,sans-serif;background:#0a0a14;color:#e2e8f0;padding:32px;border-radius:12px'>" +
                "<h2 style='color:#8b5cf6'>EduFlow</h2>" +
                "<p>Votre code de verification :</p>" +
                "<p style='font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1'>" + code + "</p>" +
                "<p style='color:#94a3b8;font-size:13px'>Ce code expire dans " + props.getOtp().getExpiryMinutes() + " minutes.</p>" +
                "</div>";

        String provider = resolveProvider();
        switch (provider) {
            case "mailpit":
                if (!sendSmtp(to, subject, body, "MAILPIT")) {
                    log.warn("[MAILPIT] capture unavailable. Falling back to dev log output.");
                    logDevOtp(to, code, purpose);
                }
                return;
            case "smtp":
                if (!sendSmtp(to, subject, body, "SMTP")) {
                    throw new IllegalStateException("Failed to send SMTP email");
                }
                return;
            case "resend":
                sendResend(to, subject, body);
                return;
            default:
                logDevOtp(to, code, purpose);
        }
    }

    private String resolveProvider() {
        String configured = props.getEmail().getProvider();
        if (configured != null && !configured.isBlank()) {
            return configured.trim().toLowerCase(Locale.ROOT);
        }
        return hasResendApiKey() ? "resend" : "log";
    }

    private boolean sendSmtp(String to, String subject, String html, String label) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(props.getEmail().getFromAddress(), props.getEmail().getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);

            if ("MAILPIT".equals(label)) {
                log.info("[MAILPIT] captured email to {}. Inbox: {}", to, props.getEmail().getInboxUrl());
            } else {
                log.info("[SMTP-EMAIL] sent email to {} via {}:{}", to,
                        props.getEmail().getSmtpHost(), props.getEmail().getSmtpPort());
            }
            return true;
        } catch (Exception e) {
            log.error("Failed to send {} email to {}: {}", label, to, e.getMessage());
            return false;
        }
    }

    private void sendResend(String to, String subject, String html) {
        if (!hasResendApiKey()) {
            log.warn("[RESEND] RESEND_API_KEY is missing. Falling back to dev log output for {}.", to);
            log.warn("[DEV-EMAIL] queued for delivery to {} (subject: {}). Configure RESEND_API_KEY to actually send.", to, subject);
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(props.getEmail().getResendApiKey());
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

    private void logDevOtp(String to, String code, String purpose) {
        log.info("[DEV-OTP-DELIVERY] purpose={} to={} (local dev mode)", purpose, to);
        log.info("==========================================================");
        log.info("[DEV-OTP-CODE] purpose={} to={} code={}", purpose, to, code);
        log.info("==========================================================");
    }

    private boolean hasResendApiKey() {
        return props.getEmail().getResendApiKey() != null && !props.getEmail().getResendApiKey().isBlank();
    }
}
