package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.inzuconnect.inzuconnect_api.domain.enums.AccountStatus;
import com.inzuconnect.inzuconnect_api.domain.enums.TeamRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class AdminUserSettingsDto {

    /* -------- Business Account Management -------- */
    @Size(max = 255)
    private String businessDisplayName;

    private TeamRole teamRole;

    private String b2bCompanyId;

    /* -------- Financial & Tax Data -------- */
    @Size(max = 128)
    private String taxpayerNumber;

    @Size(max = 255)
    private String taxpayerName;

    @Size(max = 1024)
    private String taxpayerAddress;

    @Size(max = 128)
    private String taxpayerCountry;

    @Size(max = 255)
    private String legalOwnerName;

    @Size(max = 255)
    private String legalOwnerEmail;

    private Map<String, Object> taxDocuments;

    /* -------- Team Permissions -------- */
    private Set<String> teamMemberIds;
    private Map<String, Object> teamPermissions;

    /* -------- Account Deactivation -------- */
    private AccountStatus accountStatus;

    @Size(max = 2048)
    private String deactivationReason;
}
