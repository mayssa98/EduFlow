package com.eduflow.service;

import com.eduflow.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class GoogleOAuthService {
    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);
    private final AppProperties props;
    private final RestClient http = RestClient.create();

    public GoogleOAuthService(AppProperties props) {
        this.props = props;
    }

    public GoogleProfile exchangeCode(String code, String redirectUri) {
        if (props.getGoogle().getClientId() == null || props.getGoogle().getClientId().isBlank()) {
            throw new IllegalStateException("Google OAuth is not configured");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", props.getGoogle().getClientId());
        form.add("client_secret", props.getGoogle().getClientSecret());
        form.add("redirect_uri", redirectUri != null ? redirectUri : props.getGoogle().getRedirectUri());
        form.add("grant_type", "authorization_code");

        @SuppressWarnings("unchecked")
        Map<String, Object> tokenResp = http.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);
        if (tokenResp == null || tokenResp.get("access_token") == null) {
            throw new IllegalStateException("Google token exchange failed");
        }
        String accessToken = (String) tokenResp.get("access_token");

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = http.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);
        if (profile == null) throw new IllegalStateException("Google userinfo failed");
        return new GoogleProfile(
                (String) profile.get("sub"),
                (String) profile.get("email"),
                (String) profile.getOrDefault("given_name", ""),
                (String) profile.getOrDefault("family_name", ""),
                (String) profile.get("picture")
        );
    }

    public record GoogleProfile(String sub, String email, String givenName, String familyName, String picture) {}
}
