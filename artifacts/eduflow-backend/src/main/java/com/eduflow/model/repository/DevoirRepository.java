package com.eduflow.model.repository;

import com.eduflow.model.entity.Devoir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevoirRepository extends JpaRepository<Devoir, Long> {
    List<Devoir> findByCoursId(Long coursId);

    @org.springframework.data.jpa.repository.Query(
        "select d from Devoir d where d.cours.enseignant.id = :teacherId")
    List<Devoir> findByTeacherId(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Query(
        "select count(d) from Devoir d where d.cours.enseignant.id = :teacherId")
    long countByTeacherId(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);
}
