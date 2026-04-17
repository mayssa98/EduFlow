package com.eduflow.service;

public final class EmailNormalizer {
    private EmailNormalizer() {}

    public static String normalize(String email) {
        if (email == null) return null;
        String lower = email.trim().toLowerCase();
        int at = lower.indexOf('@');
        if (at < 0) return lower;
        String local = lower.substring(0, at);
        String domain = lower.substring(at);
        int plus = local.indexOf('+');
        if (plus >= 0) local = local.substring(0, plus);
        local = local.replace(".", "");
        return local + domain;
    }
}
