package com.eduflow.model.repository;

import com.eduflow.model.entity.Inscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {
    List<Inscription> findByEtudiantId(Long etudiantId);
    List<Inscription> findByCoursId(Long coursId);

    java.util.Optional<Inscription> findByEtudiantIdAndCoursId(Long etudiantId, Long coursId);

    long countByCoursId(Long coursId);
}
