package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.AgentCommission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentCommissionRepository extends JpaRepository<AgentCommission, String> {
    List<AgentCommission> findByAgentId(String agentId);
}
