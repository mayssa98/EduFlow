package com.eduflow.model.repository;

import com.eduflow.model.entity.PredictionRisque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionRisqueRepository extends JpaRepository<PredictionRisque, Long> {
    List<PredictionRisque> findByAnalyseId(Long analyseId);
}
