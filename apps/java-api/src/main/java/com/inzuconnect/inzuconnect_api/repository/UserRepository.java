package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    List<User> findByReferredByAgentId(String agentId);

    @Query("SELECT u FROM User u WHERE u.b2bCompany.id = :b2bCompanyId")
    List<User> findByB2bCompanyId(@Param("b2bCompanyId") String b2bCompanyId);

    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
