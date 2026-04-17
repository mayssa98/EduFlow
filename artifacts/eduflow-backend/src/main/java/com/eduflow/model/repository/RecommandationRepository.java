package com.eduflow.model.repository;

import com.eduflow.model.entity.Recommandation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommandationRepository extends JpaRepository<Recommandation, Long> {
    List<Recommandation> findByPredictionIdOrderByOrdreAsc(Long predictionId);
}
