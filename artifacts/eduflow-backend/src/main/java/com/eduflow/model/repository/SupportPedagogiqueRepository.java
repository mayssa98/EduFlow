package com.eduflow.model.repository;

import com.eduflow.model.entity.SupportPedagogique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportPedagogiqueRepository extends JpaRepository<SupportPedagogique, Long> {
    List<SupportPedagogique> findByCoursId(Long coursId);
}
