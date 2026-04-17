package com.eduflow.config;

import com.eduflow.model.entity.Administrateur;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.repository.UtilisateurRepository;
import com.eduflow.service.EmailNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UtilisateurRepository userRepo;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public AdminSeeder(UtilisateurRepository userRepo, PasswordEncoder encoder, AppProperties props) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    public void run(String... args) {
        String email = props.getAdmin().getDefaultEmail();
        String password = props.getAdmin().getDefaultPassword();
        if (email == null || password == null) return;
        String normalized = EmailNormalizer.normalize(email);
        if (userRepo.existsByEmailNormalized(normalized)) {
            log.info("Default admin already exists ({}), skipping seed.", email);
            return;
        }
        Administrateur admin = new Administrateur();
        admin.setEmail(email.toLowerCase());
        admin.setEmailNormalized(normalized);
        admin.setNom("Admin");
        admin.setPrenom("EduFlow");
        admin.setRole(Role.ADMIN);
        admin.setStatutCompte(StatutCompte.ACTIVE);
        admin.setMotDePasseHash(encoder.encode(password));
        admin.setFonction("Super Administrator");
        userRepo.save(admin);
        log.info("Seeded default admin account: {}", email);
    }
}
