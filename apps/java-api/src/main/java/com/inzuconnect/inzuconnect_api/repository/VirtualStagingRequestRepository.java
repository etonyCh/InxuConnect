package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.VirtualStagingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VirtualStagingRequestRepository extends JpaRepository<VirtualStagingRequest, String> {
    Optional<VirtualStagingRequest> findByListingId(String listingId);
    List<VirtualStagingRequest> findByListingIdOrderByCreatedAtDesc(String listingId);
}
