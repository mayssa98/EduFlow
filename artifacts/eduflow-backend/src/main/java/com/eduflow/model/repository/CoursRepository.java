package com.eduflow.model.repository;

import com.eduflow.model.entity.Cours;
import com.eduflow.model.entity.enums.StatutCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoursRepository extends JpaRepository<Cours, Long> {
    List<Cours> findByEnseignantId(Long enseignantId);
    List<Cours> findByStatut(StatutCours statut);
    long countByStatut(StatutCours statut);
}
