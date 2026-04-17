package com.eduflow.security;

import com.eduflow.config.AppProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {
    public static final String ACCESS_COOKIE = "ef_access";
    public static final String REFRESH_COOKIE = "ef_refresh";

    private final boolean secure;
    private final String sameSite;

    public CookieUtil(AppProperties props) {
        this.secure = props.getCookie().isSecure();
        this.sameSite = props.getCookie().getSameSite();
    }

    public void writeAccessCookie(HttpServletResponse resp, String token, Duration ttl) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api")
                .maxAge(ttl)
                .build();
        resp.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void writeRefreshCookie(HttpServletResponse resp, String token, Duration ttl) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api/auth")
                .maxAge(ttl)
                .build();
        resp.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearAuthCookies(HttpServletResponse resp) {
        ResponseCookie a = ResponseCookie.from(ACCESS_COOKIE, "")
                .httpOnly(true).secure(secure).sameSite(sameSite).path("/api").maxAge(0).build();
        ResponseCookie r = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true).secure(secure).sameSite(sameSite).path("/api/auth").maxAge(0).build();
        resp.addHeader(HttpHeaders.SET_COOKIE, a.toString());
        resp.addHeader(HttpHeaders.SET_COOKIE, r.toString());
    }

    public String readCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) {
            if (c.getName().equals(name)) return c.getValue();
        }
        return null;
    }
}
