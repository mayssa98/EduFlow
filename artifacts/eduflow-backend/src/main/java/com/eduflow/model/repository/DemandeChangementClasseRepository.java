package com.eduflow.model.repository;

import com.eduflow.model.entity.DemandeChangementClasse;
import com.eduflow.model.entity.enums.StatutDemandeChangement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeChangementClasseRepository extends JpaRepository<DemandeChangementClasse, Long> {
    List<DemandeChangementClasse> findByStatut(StatutDemandeChangement statut);
    List<DemandeChangementClasse> findByEtudiantId(Long etudiantId);
}
