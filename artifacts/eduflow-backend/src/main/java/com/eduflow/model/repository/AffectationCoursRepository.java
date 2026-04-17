package com.eduflow.model.repository;

import com.eduflow.model.entity.AffectationCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffectationCoursRepository extends JpaRepository<AffectationCours, Long> {
    List<AffectationCours> findByCoursId(Long coursId);
    List<AffectationCours> findByGroupeClasseId(Long groupeClasseId);
}
