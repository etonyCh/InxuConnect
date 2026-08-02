package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, String>, JpaSpecificationExecutor<Listing> {
    Page<Listing> findByCityIgnoreCase(String city, Pageable pageable);
    List<Listing> findByCityIgnoreCase(String city);
    Page<Listing> findByOwnerId(String ownerId, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.owner.id IN :ownerIds")
    List<Listing> findAllByIdInOwnerIds(@Param("ownerIds") Collection<String> ownerIds);
}
