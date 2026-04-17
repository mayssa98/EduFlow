package com.eduflow.model.repository;

import com.eduflow.model.entity.GroupeClasse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupeClasseRepository extends JpaRepository<GroupeClasse, Long> {
}
