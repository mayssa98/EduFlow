package com.eduflow.model.repository;

import com.eduflow.model.entity.Devoir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevoirRepository extends JpaRepository<Devoir, Long> {
    List<Devoir> findByCoursId(Long coursId);
}
