package com.eduflow.model.repository;

import com.eduflow.model.entity.AnalyseIA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalyseIARepository extends JpaRepository<AnalyseIA, Long> {
    List<AnalyseIA> findByCoursIdOrderByDateAnalyseDesc(Long coursId);
}
