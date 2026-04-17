package com.eduflow.model.repository;

import com.eduflow.model.entity.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {
    List<Etudiant> findByGroupeClasseId(Long groupeClasseId);
}
