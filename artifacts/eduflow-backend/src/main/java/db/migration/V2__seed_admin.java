package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class V2__seed_admin extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        String email = envOr("ADMIN_DEFAULT_EMAIL", "admin@eduflow.com");
        String password = envOr("ADMIN_DEFAULT_PASSWORD", "Admin@EduFlow2026");
        String emailNormalized = email.trim().toLowerCase();
        String hash = new BCryptPasswordEncoder(12).encode(password);

        try (Statement s = context.getConnection().createStatement();
             ResultSet rs = s.executeQuery(
                     "SELECT id FROM utilisateur WHERE email_normalized = '"
                             + emailNormalized.replace("'", "''") + "'")) {
            if (rs.next()) {
                return;
            }
        }

        long id;
        try (PreparedStatement ps = context.getConnection().prepareStatement(
                "INSERT INTO utilisateur " +
                        "(email, email_normalized, mot_de_passe_hash, nom, prenom, role, statut_compte, locale) " +
                        "VALUES (?, ?, ?, 'Admin', 'EduFlow', 'ADMIN', 'ACTIVE', 'fr') RETURNING id")) {
            ps.setString(1, email);
            ps.setString(2, emailNormalized);
            ps.setString(3, hash);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                id = rs.getLong(1);
            }
        }

        try (PreparedStatement ps = context.getConnection().prepareStatement(
                "INSERT INTO administrateur (id, fonction) VALUES (?, 'Super Admin')")) {
            ps.setLong(1, id);
            ps.executeUpdate();
        }
    }

    private static String envOr(String key, String fallback) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? fallback : v;
    }
}
