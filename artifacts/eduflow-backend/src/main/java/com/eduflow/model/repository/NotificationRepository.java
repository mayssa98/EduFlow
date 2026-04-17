package com.eduflow.model.repository;

import com.eduflow.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);
    long countByUtilisateurIdAndLuFalse(Long utilisateurId);
}
