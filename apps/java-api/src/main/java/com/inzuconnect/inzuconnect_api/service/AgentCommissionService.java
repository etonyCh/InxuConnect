package com.inzuconnect.inzuconnect_api.service;

import com.inzuconnect.inzuconnect_api.domain.AgentCommission;
import com.inzuconnect.inzuconnect_api.domain.Booking;
import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.CommissionStatus;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import com.inzuconnect.inzuconnect_api.repository.AgentCommissionRepository;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AgentCommissionService {

    private final AgentCommissionRepository commissionRepository;
    private final UserRepository userRepository;

    public AgentCommissionService(AgentCommissionRepository commissionRepository, UserRepository userRepository) {
        this.commissionRepository = commissionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Calculates 3% affiliate commission for referral agent on confirmed booking.
     */
    @Transactional
    public void processBookingCommission(Booking booking) {
        if (booking == null || booking.getGuest() == null) return;

        User guest = booking.getGuest();
        String agentId = guest.getReferredByAgentId();

        if (agentId != null && !agentId.trim().isEmpty()) {
            Optional<User> agentOpt = userRepository.findById(agentId);
            if (agentOpt.isPresent() && agentOpt.get().getRole() == Role.AGENT) {
                User agent = agentOpt.get();
                int bookingTotal = booking.getTotalPrice();
                int commissionAmount = (int) Math.round(bookingTotal * 0.03); // 3% commission

                AgentCommission commission = AgentCommission.builder()
                        .agentId(agent.getId())
                        .bookingId(booking.getId())
                        .amount(commissionAmount)
                        .status(CommissionStatus.PENDING)
                        .build();

                commissionRepository.save(commission);
                System.out.println("[COMMISSION AGENT] 3% (" + commissionAmount + " FBU) attribués à l'agent " + agent.getName() + " pour la réservation " + booking.getId());
            }
        }
    }
}
