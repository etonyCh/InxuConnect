package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.inzuconnect.inzuconnect_api.domain.enums.PayoutProvider;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserSettingsDto {

    public interface PersonalInfo {}
    public interface PaymentPayouts {}
    public interface Notifications {}
    public interface PrivacySharing {}
    public interface HostCoHosts {}
    public interface AdminBusiness {}
    public interface AdminTax {}
    public interface AdminTeam {}
    public interface AccountDeactivation {}

    /* ---------------- Guest / Personal Info & Profile ---------------- */
    @Size(max = 1024, groups = {PersonalInfo.class})
    private String avatarUrl;

    @Size(max = 1024, groups = {PersonalInfo.class})
    private String idDocumentUrl;

    @Size(max = 64, groups = {PersonalInfo.class})
    private String idDocumentType;

    @Size(max = 255, groups = {PersonalInfo.class})
    private String name;

    @Size(max = 255, groups = {PersonalInfo.class})
    private String email;

    @Size(max = 32, groups = {PersonalInfo.class})
    private String phone;

    @Size(max = 8, groups = {PersonalInfo.class})
    private String preferredCurrency;

    @Size(max = 8, groups = {PersonalInfo.class})
    private String locale;

    @Size(max = 64, groups = {PersonalInfo.class})
    private String timezone;

    /* ---------------- Guest / Payments & Payouts ---------------- */
    private PayoutProvider defaultPayoutProvider;

    @Size(max = 255, groups = {PaymentPayouts.class})
    private String defaultPayoutAccount;

    private Map<String, Object> savedPaymentMethods;

    @Min(value = 0, groups = {PaymentPayouts.class})
    private Integer discountCredits;

    /* ---------------- Guest / Notifications ---------------- */
    private Boolean notifyPush;
    private Boolean notifyEmail;
    private Boolean notifySms;
    private Boolean notifyTrips;
    private Boolean notifyMessages;
    private Boolean notifyPromotions;

    /* ---------------- Guest / Privacy & Sharing ---------------- */
    private Map<String, Object> connectedSocialAccounts;
    private Boolean shareBookingHistoryWithAgents;
    private Boolean shareProfileWithCoHosts;
    private Boolean allowProfileSearch;

    /* ---------------- Host / Co-Host Access (user-level defaults) ---------------- */
    private Set<String> hostCoHostIds;
    private Map<String, Object> hostCoHostPermissions;

    /* ---------------- Admin / Business Account Management ---------------- */
    @Size(max = 255, groups = {AdminBusiness.class})
    private String businessDisplayName;

    /* ---------------- Admin / Financial & Tax Data ---------------- */
    @Size(max = 128, groups = {AdminTax.class})
    private String taxpayerNumber;

    @Size(max = 255, groups = {AdminTax.class})
    private String taxpayerName;

    @Size(max = 1024, groups = {AdminTax.class})
    private String taxpayerAddress;

    @Size(max = 128, groups = {AdminTax.class})
    private String taxpayerCountry;

    @Size(max = 255, groups = {AdminTax.class})
    private String legalOwnerName;

    @Size(max = 255, groups = {AdminTax.class})
    private String legalOwnerEmail;

    private Map<String, Object> taxDocuments;

    /* ---------------- Admin / Team Permissions ---------------- */
    private Set<String> teamMemberIds;
    private Map<String, Object> teamPermissions;
}
