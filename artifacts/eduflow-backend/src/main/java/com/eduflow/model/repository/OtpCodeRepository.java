package com.eduflow.model.repository;

import com.eduflow.model.entity.OtpCode;
import com.eduflow.model.entity.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findFirstByUtilisateurIdAndPurposeAndConsumedAtIsNullOrderByDateCreationDesc(
            Long utilisateurId, OtpPurpose purpose);
}
