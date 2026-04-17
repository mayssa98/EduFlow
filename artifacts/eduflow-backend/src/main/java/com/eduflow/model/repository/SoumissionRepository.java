package com.eduflow.model.repository;

import com.eduflow.model.entity.Soumission;
import com.eduflow.model.entity.enums.StatutDevoir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoumissionRepository extends JpaRepository<Soumission, Long> {
    List<Soumission> findByDevoirId(Long devoirId);
    List<Soumission> findByEtudiantId(Long etudiantId);
    Optional<Soumission> findByDevoirIdAndEtudiantId(Long devoirId, Long etudiantId);

    long countByStatut(StatutDevoir statut);

    java.util.List<Soumission> findTop10ByOrderByDateSoumissionDesc();

    @Query("select count(s) from Soumission s where s.devoir.id = :devoirId")
    long countByDevoirId(@Param("devoirId") Long devoirId);

    @Query("select count(s) from Soumission s where s.devoir.id = :devoirId and s.statut = :statut")
    long countByDevoirIdAndStatut(@Param("devoirId") Long devoirId, @Param("statut") StatutDevoir statut);

    @Query("select coalesce(avg(s.note), 0) from Soumission s where s.devoir.id = :devoirId and s.statut = com.eduflow.model.entity.enums.StatutDevoir.GRADED")
    Double averageGradeForAssignment(@Param("devoirId") Long devoirId);

    @Query("select coalesce(avg(s.note), 0) from Soumission s where s.statut = com.eduflow.model.entity.enums.StatutDevoir.GRADED and s.devoir.cours.enseignant.id = :teacherId")
    Double averageGradeForTeacher(@Param("teacherId") Long teacherId);
}
