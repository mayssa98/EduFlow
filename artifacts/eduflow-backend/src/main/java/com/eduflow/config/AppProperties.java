package com.eduflow.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "eduflow")
@Getter
@Setter
public class AppProperties {
    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Otp otp = new Otp();
    private Login login = new Login();
    private Admin admin = new Admin();
    private Email email = new Email();
    private Google google = new Google();
    private Cookie cookie = new Cookie();

    @Getter @Setter public static class Jwt {
        private String accessSecret;
        private String refreshSecret;
        private int accessExpiryMinutes = 15;
        private int refreshExpiryDays = 7;
    }
    @Getter @Setter public static class Cors {
        private String allowedOrigin;
    }
    @Getter @Setter public static class Otp {
        private int expiryMinutes = 10;
        private int maxAttempts = 5;
    }
    @Getter @Setter public static class Login {
        private int maxAttempts = 5;
    }
    @Getter @Setter public static class Admin {
        private String defaultEmail;
        private String defaultPassword;
    }
    @Getter @Setter public static class Email {
        private String resendApiKey;
        private String fromAddress;
        private String fromName;
    }
    @Getter @Setter public static class Google {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }
    @Getter @Setter public static class Cookie {
        private boolean secure = true;
        private String sameSite = "Strict";
    }
}
