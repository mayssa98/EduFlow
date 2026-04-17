package com.eduflow.model.repository;

import com.eduflow.model.entity.Enseignant;
import com.eduflow.model.entity.enums.StatutCompte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnseignantRepository extends JpaRepository<Enseignant, Long> {
    List<Enseignant> findByStatutCompte(StatutCompte statutCompte);
}
