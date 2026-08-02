package com.inzuconnect.inzuconnect_api.domain;

import com.inzuconnect.inzuconnect_api.domain.enums.AccountStatus;
import com.inzuconnect.inzuconnect_api.domain.enums.Badge;
import com.inzuconnect.inzuconnect_api.domain.enums.PayoutProvider;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import com.inzuconnect.inzuconnect_api.domain.enums.TeamRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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

    @Column(name = "\"referredByAgentId\"")
    private String referredByAgentId;

    @Version
    @Column(name = "\"version\"", nullable = false)
    private Long version = 0L;

    /* =========================================================================================
     * GUEST SETTINGS (Personal Info / Payments & Payouts / Notifications / Privacy & Sharing)
     * ========================================================================================= */

    @Column(name = "\"avatarUrl\"", length = 1024)
    private String avatarUrl;

    @Column(name = "\"idDocumentUrl\"", length = 1024)
    private String idDocumentUrl;

    @Column(name = "\"idDocumentType\"")
    private String idDocumentType;

    @Column(name = "\"preferredCurrency\"", length = 8, nullable = false)
    private String preferredCurrency = "BIF";

    @Column(name = "\"locale\"", length = 8, nullable = false)
    private String locale = "fr-BI";

    @Column(name = "\"timezone\"", length = 64, nullable = false)
    private String timezone = "Africa/Bujumbura";

    @Enumerated(EnumType.STRING)
    @Column(name = "\"defaultPayoutProvider\"")
    private PayoutProvider defaultPayoutProvider;

    @Column(name = "\"defaultPayoutAccount\"")
    private String defaultPayoutAccount;

    @Column(name = "\"savedPaymentMethods\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> savedPaymentMethods = new HashMap<>();

    @Column(name = "\"discountCredits\"", nullable = false)
    private Integer discountCredits = 0;

    /* ----- Notifications ----- */

    @Column(name = "\"notifyPush\"", nullable = false)
    private boolean notifyPush = true;

    @Column(name = "\"notifyEmail\"", nullable = false)
    private boolean notifyEmail = true;

    @Column(name = "\"notifySms\"", nullable = false)
    private boolean notifySms = true;

    @Column(name = "\"notifyTrips\"", nullable = false)
    private boolean notifyTrips = true;

    @Column(name = "\"notifyMessages\"", nullable = false)
    private boolean notifyMessages = true;

    @Column(name = "\"notifyPromotions\"", nullable = false)
    private boolean notifyPromotions = false;

    /* ----- Privacy & Sharing ----- */

    @Column(name = "\"connectedSocialAccounts\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> connectedSocialAccounts = new HashMap<>();

    @Column(name = "\"shareBookingHistoryWithAgents\"", nullable = false)
    private boolean shareBookingHistoryWithAgents = false;

    @Column(name = "\"shareProfileWithCoHosts\"", nullable = false)
    private boolean shareProfileWithCoHosts = true;

    @Column(name = "\"allowProfileSearch\"", nullable = false)
    private boolean allowProfileSearch = true;

    /* =========================================================================================
     * HOST SETTINGS
     * ========================================================================================= */

    @Column(name = "\"hostCoHostIds\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Set<String> hostCoHostIds = new HashSet<>();

    @Column(name = "\"hostCoHostPermissions\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> hostCoHostPermissions = new HashMap<>();

    /* =========================================================================================
     * ADMIN / BUSINESS ACCOUNT SETTINGS (Business / Financial / Team / Account Deactivation)
     * ========================================================================================= */

    @Enumerated(EnumType.STRING)
    @Column(name = "\"teamRole\"")
    private TeamRole teamRole;

    @Column(name = "\"businessDisplayName\"")
    private String businessDisplayName;

    @Column(name = "\"taxpayerNumber\"")
    private String taxpayerNumber;

    @Column(name = "\"taxpayerName\"")
    private String taxpayerName;

    @Column(name = "\"taxpayerAddress\"", columnDefinition = "TEXT")
    private String taxpayerAddress;

    @Column(name = "\"taxpayerCountry\"")
    private String taxpayerCountry = "Burundi";

    @Column(name = "\"legalOwnerName\"")
    private String legalOwnerName;

    @Column(name = "\"legalOwnerEmail\"")
    private String legalOwnerEmail;

    @Column(name = "\"taxDocuments\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> taxDocuments = new HashMap<>();

    @Column(name = "\"teamMemberIds\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Set<String> teamMemberIds = new HashSet<>();

    @Column(name = "\"teamPermissions\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> teamPermissions = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "\"accountStatus\"", nullable = false)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "\"deactivatedAt\"")
    private LocalDateTime deactivatedAt;

    @Column(name = "\"deactivationReason\"", columnDefinition = "TEXT")
    private String deactivationReason;

    @Column(name = "\"deactivatedByUserId\"")
    private String deactivatedByUserId;
}
