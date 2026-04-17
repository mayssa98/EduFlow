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
    long countByEnseignantId(Long enseignantId);
    long countByEnseignantIdAndStatut(Long enseignantId, StatutCours statut);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(sum(c.nbConsultations), 0) from Cours c where c.enseignant.id = :teacherId")
    Long sumConsultationsForTeacher(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);
}
