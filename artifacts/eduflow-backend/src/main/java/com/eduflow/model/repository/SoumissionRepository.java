package com.eduflow.model.repository;

import com.eduflow.model.entity.Soumission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoumissionRepository extends JpaRepository<Soumission, Long> {
    List<Soumission> findByDevoirId(Long devoirId);
    List<Soumission> findByEtudiantId(Long etudiantId);
    Optional<Soumission> findByDevoirIdAndEtudiantId(Long devoirId, Long etudiantId);
}
