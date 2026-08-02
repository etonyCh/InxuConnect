package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.KycRequest;
import com.inzuconnect.inzuconnect_api.domain.enums.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycRequestRepository extends JpaRepository<KycRequest, String> {
    Optional<KycRequest> findByUserId(String userId);
    List<KycRequest> findByStatus(KycStatus status);
    List<KycRequest> findByStatusOrderByCreatedAtDesc(KycStatus status);
    long countByStatus(KycStatus status);
}
