package com.eduflow.model.repository;

import com.eduflow.model.entity.Utilisateur;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmailNormalized(String emailNormalized);
    Optional<Utilisateur> findByGoogleSubject(String googleSubject);
    boolean existsByEmailNormalized(String emailNormalized);
    List<Utilisateur> findByStatutCompte(StatutCompte statutCompte);
    List<Utilisateur> findByRole(Role role);
    long countByRole(Role role);
    long countByStatutCompte(StatutCompte statutCompte);

    long countByRoleAndStatutCompte(Role role, StatutCompte statutCompte);

    java.util.List<Utilisateur> findByRoleAndStatutCompteOrderByDateCreationDesc(Role role, StatutCompte statutCompte);
    java.util.List<Utilisateur> findByRoleOrderByDateCreationDesc(Role role);
    java.util.List<Utilisateur> findByStatutCompteOrderByDateCreationDesc(StatutCompte statutCompte);
    java.util.List<Utilisateur> findAllByOrderByDateCreationDesc();
}
