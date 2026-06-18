package com.inzuconnect.inzuconnect_api.domain;

import com.inzuconnect.inzuconnect_api.domain.enums.Badge;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"User\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    private String phone;

    @Column(name = "\"phoneVerified\"", nullable = false)
    private boolean phoneVerified = false;

    @Column(name = "\"otpCode\"")
    private String otpCode;

    @Column(name = "\"otpExpiresAt\"")
    private LocalDateTime otpExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.GUEST;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Badge badge = Badge.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "\"kycStatus\"", nullable = false)
    private com.inzuconnect.inzuconnect_api.domain.enums.KycStatus kycStatus = com.inzuconnect.inzuconnect_api.domain.enums.KycStatus.NONE;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"b2bCompanyId\"")
    private B2bCompany b2bCompany;

    @Column(name = "\"microSavingsEnabled\"", nullable = false)
    private boolean microSavingsEnabled = false;

    @Column(name = "\"savingsBalance\"", nullable = false)
    private Integer savingsBalance = 0;

    // TODO: Add relationships (listings, bookings, etc.) after creating their entities.
}
