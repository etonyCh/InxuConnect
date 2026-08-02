package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.B2bCompany;
import com.inzuconnect.inzuconnect_api.domain.Listing;
import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.AccountStatus;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import com.inzuconnect.inzuconnect_api.repository.B2bCompanyRepository;
import com.inzuconnect.inzuconnect_api.repository.ListingRepository;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import com.inzuconnect.inzuconnect_api.web.dto.AdminUserSettingsDto;
import com.inzuconnect.inzuconnect_api.web.dto.ListingSettingsDto;
import com.inzuconnect.inzuconnect_api.web.dto.UserSettingsDto;
import com.inzuconnect.inzuconnect_api.web.error.ForbiddenException;
import com.inzuconnect.inzuconnect_api.web.error.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

@RestController
@RequestMapping
public class SettingsController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final B2bCompanyRepository b2bCompanyRepository;

    public SettingsController(UserRepository userRepository,
                              ListingRepository listingRepository,
                              B2bCompanyRepository b2bCompanyRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.b2bCompanyRepository = b2bCompanyRepository;
    }

    /* =============================================================================================
     * SELF / GUEST + HOST — GET / PATCH /api/me/settings
     * ============================================================================================= */

    @GetMapping("/api/me/settings")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<UserSettingsDto> getMySettings() {
        User me = currentUserOrThrow();
        return ResponseEntity.ok(userToSettings(me));
    }

    @PatchMapping("/api/me/settings")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<UserSettingsDto> patchMySettings(@Valid @RequestBody UserSettingsDto payload) {
        User me = currentUserOrThrow();
        if (me.getAccountStatus() == AccountStatus.DEACTIVATED || me.getAccountStatus() == AccountStatus.BANNED) {
            throw new ForbiddenException("Votre compte est désactivé.");
        }
        applyGuestSettings(me, payload, true);
        applyHostSettings(me, payload, true);
        return ResponseEntity.ok(userToSettings(userRepository.save(me)));
    }

    /* =============================================================================================
     * HOST — GET / PATCH /api/host/listings/{id}/settings
     * ============================================================================================= */

    @GetMapping("/api/host/listings/{id}/settings")
    @PreAuthorize("hasAnyRole('HOST','AGENT','PARTNER','ADMIN','B2B')")
    @Transactional(readOnly = true)
    public ResponseEntity<ListingSettingsDto> getListingSettings(@PathVariable String id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", id));
        ensureHostOrAdminOrAgent(listing);
        return ResponseEntity.ok(listingToSettings(listing));
    }

    @PatchMapping("/api/host/listings/{id}/settings")
    @PreAuthorize("hasAnyRole('HOST','AGENT','PARTNER','ADMIN','B2B')")
    @Transactional
    public ResponseEntity<ListingSettingsDto> patchListingSettings(@PathVariable String id,
                                                                    @Valid @RequestBody ListingSettingsDto payload) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", id));
        ensureHostOrAdminOrAgent(listing);
        applyListingSettings(listing, payload);
        return ResponseEntity.ok(listingToSettings(listingRepository.save(listing)));
    }

    /* =============================================================================================
     * ADMIN / B2B ADMIN — GET / PATCH /api/admin/users/{id}/settings
     * ============================================================================================= */

    @GetMapping("/api/admin/users/{id}/settings")
    @PreAuthorize("hasAnyRole('ADMIN','B2B')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getUserSettingsAsAdmin(@PathVariable String id) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        User admin = currentUserOrThrow();
        ensureSameB2bCompany(admin, target);

        Map<String, Object> envelope = new HashMap<>();
        envelope.put("userId", target.getId());
        envelope.put("accountStatus", target.getAccountStatus() != null ? target.getAccountStatus().name() : null);
        envelope.put("role", target.getRole() != null ? target.getRole().name() : null);
        envelope.put("teamRole", target.getTeamRole() != null ? target.getTeamRole().name() : null);
        envelope.put("b2bCompanyId", target.getB2bCompany() != null ? target.getB2bCompany().getId() : null);
        envelope.put("userSettings", userToSettings(target));
        envelope.put("admin", new HashMap<String, Object>(Map.of(
                "businessDisplayName", nvl(target.getBusinessDisplayName()),
                "taxpayerNumber", nvl(target.getTaxpayerNumber()),
                "taxpayerName", nvl(target.getTaxpayerName()),
                "taxpayerAddress", nvl(target.getTaxpayerAddress()),
                "taxpayerCountry", nvl(target.getTaxpayerCountry()),
                "legalOwnerName", nvl(target.getLegalOwnerName()),
                "legalOwnerEmail", nvl(target.getLegalOwnerEmail())
        )) {{
            put("taxDocuments", target.getTaxDocuments() != null ? target.getTaxDocuments() : Map.of());
            put("teamMemberIds", target.getTeamMemberIds() != null ? target.getTeamMemberIds() : java.util.Set.of());
            put("teamPermissions", target.getTeamPermissions() != null ? target.getTeamPermissions() : Map.of());
            put("deactivatedAt", target.getDeactivatedAt() != null ? target.getDeactivatedAt().toString() : null);
            put("deactivationReason", target.getDeactivationReason());
            put("deactivatedByUserId", target.getDeactivatedByUserId());
        }});
        return ResponseEntity.ok(envelope);
    }

    @PatchMapping("/api/admin/users/{id}/settings")
    @PreAuthorize("hasAnyRole('ADMIN','B2B')")
    @Transactional
    public ResponseEntity<Map<String, Object>> patchUserSettingsAsAdmin(@PathVariable String id,
                                                                        @Valid @RequestBody AdminUserSettingsDto payload) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        User admin = currentUserOrThrow();
        ensureSameB2bCompany(admin, target);

        applyAdminBusinessSettings(target, payload);
        applyAdminTaxSettings(target, payload);
        applyAdminTeamSettings(target, payload, admin);
        applyAccountStatus(target, payload, admin);

        userRepository.save(target);

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", target.getId());
        resp.put("accountStatus", target.getAccountStatus() != null ? target.getAccountStatus().name() : null);
        resp.put("role", target.getRole() != null ? target.getRole().name() : null);
        resp.put("teamRole", target.getTeamRole() != null ? target.getTeamRole().name() : null);
        resp.put("businessDisplayName", target.getBusinessDisplayName());
        resp.put("taxpayerNumber", target.getTaxpayerNumber());
        resp.put("teamMemberIds", target.getTeamMemberIds() != null ? target.getTeamMemberIds() : java.util.Set.of());
        resp.put("deactivatedAt", target.getDeactivatedAt() != null ? target.getDeactivatedAt().toString() : null);
        resp.put("deactivatedByUserId", target.getDeactivatedByUserId());
        return ResponseEntity.ok(resp);
    }

    /* =============================================================================================
     * Helpers
     * ============================================================================================= */

    private User currentUserOrThrow() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .orElseThrow(() -> new com.inzuconnect.inzuconnect_api.web.error.UnauthorizedException("Session invalide."));
    }

    private boolean isStaff(User u) {
        if (u == null || u.getRole() == null) return false;
        Role r = u.getRole();
        return r == Role.ADMIN || r == Role.AGENT || r == Role.PARTNER;
    }

    private void ensureHostOrAdminOrAgent(Listing listing) {
        User me = currentUserOrThrow();
        if (me.getId().equals(listing.getOwner().getId())) return;
        if (isStaff(me)) return;
        if (listing.getCoHostIds() != null && listing.getCoHostIds().contains(me.getId())) return;
        if (listing.getOwner().getHostCoHostIds() != null && listing.getOwner().getHostCoHostIds().contains(me.getId())) return;
        throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette annonce.");
    }

    private void ensureSameB2bCompany(User admin, User target) {
        if (admin.getRole() == Role.ADMIN) return; // Platform ADMIN: full reach
        // B2B role: only accounts inside their own B2bCompany scope
        B2bCompany scope = admin.getB2bCompany();
        if (scope == null) {
            throw new ForbiddenException("Compte B2B non rattaché à une entreprise.");
        }
        if (target.getB2bCompany() == null || !Objects.equals(target.getB2bCompany().getId(), scope.getId())) {
            throw new ForbiddenException("Cet utilisateur n'appartient pas à votre entreprise.");
        }
    }

    private static <T> void applyIfNotNull(T value, Consumer<T> setter) {
        if (value != null) setter.accept(value);
    }

    private static Object nvl(Object in) {
        return in != null ? in : "";
    }

    /* -------- User -> DTO -------- */

    private static UserSettingsDto userToSettings(User u) {
        return UserSettingsDto.builder()
                .avatarUrl(u.getAvatarUrl())
                .idDocumentUrl(u.getIdDocumentUrl())
                .idDocumentType(u.getIdDocumentType())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .preferredCurrency(u.getPreferredCurrency())
                .locale(u.getLocale())
                .timezone(u.getTimezone())
                .defaultPayoutProvider(u.getDefaultPayoutProvider())
                .defaultPayoutAccount(u.getDefaultPayoutAccount())
                .savedPaymentMethods(u.getSavedPaymentMethods())
                .discountCredits(u.getDiscountCredits())
                .notifyPush(u.isNotifyPush())
                .notifyEmail(u.isNotifyEmail())
                .notifySms(u.isNotifySms())
                .notifyTrips(u.isNotifyTrips())
                .notifyMessages(u.isNotifyMessages())
                .notifyPromotions(u.isNotifyPromotions())
                .connectedSocialAccounts(u.getConnectedSocialAccounts())
                .shareBookingHistoryWithAgents(u.isShareBookingHistoryWithAgents())
                .shareProfileWithCoHosts(u.isShareProfileWithCoHosts())
                .allowProfileSearch(u.isAllowProfileSearch())
                .hostCoHostIds(u.getHostCoHostIds())
                .hostCoHostPermissions(u.getHostCoHostPermissions())
                .build();
    }

    private static ListingSettingsDto listingToSettings(Listing l) {
        return ListingSettingsDto.builder()
                .title(l.getTitle())
                .description(l.getDescription())
                .propertyType(l.getPropertyType())
                .address(l.getAddress())
                .city(l.getCity())
                .country(l.getCountry())
                .floor(l.getFloor())
                .squareMeters(l.getSquareMeters())
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .listingPublished(l.isListingPublished())
                .price(l.getPrice())
                .currency(l.getCurrency())
                .cleaningFee(l.getCleaningFee())
                .serviceFeePercent(l.getServiceFeePercent())
                .weeklyDiscountPercent(l.getWeeklyDiscountPercent())
                .monthlyDiscountPercent(l.getMonthlyDiscountPercent())
                .extraGuestFee(l.getExtraGuestFee())
                .petFee(l.getPetFee())
                .minPrice(l.getMinPrice())
                .maxPrice(l.getMaxPrice())
                .instantBookEnabled(l.isInstantBookEnabled())
                .minStayNights(l.getMinStayNights())
                .maxStayNights(l.getMaxStayNights())
                .advanceNoticeHours(l.getAdvanceNoticeHours())
                .bookingWindowDays(l.getBookingWindowDays())
                .checkInTime(l.getCheckInTime())
                .checkOutTime(l.getCheckOutTime())
                .allowPets(l.isAllowPets())
                .allowSmoking(l.isAllowSmoking())
                .allowParties(l.isAllowParties())
                .requireGuestId(l.isRequireGuestId())
                .customRules(l.getCustomRules())
                .coHostIds(l.getCoHostIds())
                .coHostPermissions(l.getCoHostPermissions())
                .build();
    }

    /* -------- Apply Guest settings to a User -------- */

    private static void applyGuestSettings(User u, UserSettingsDto p, boolean allowPersonal) {
        if (allowPersonal) {
            applyIfNotNull(p.getAvatarUrl(), u::setAvatarUrl);
            applyIfNotNull(p.getIdDocumentUrl(), u::setIdDocumentUrl);
            applyIfNotNull(p.getIdDocumentType(), u::setIdDocumentType);
            applyIfNotNull(p.getName(), u::setName);
            applyIfNotNull(p.getEmail(), u::setEmail);
            applyIfNotNull(p.getPhone(), u::setPhone);
            applyIfNotNull(p.getPreferredCurrency(), u::setPreferredCurrency);
            applyIfNotNull(p.getLocale(), u::setLocale);
            applyIfNotNull(p.getTimezone(), u::setTimezone);
        }
        applyIfNotNull(p.getDefaultPayoutProvider(), u::setDefaultPayoutProvider);
        applyIfNotNull(p.getDefaultPayoutAccount(), u::setDefaultPayoutAccount);
        applyIfNotNull(p.getSavedPaymentMethods(), u::setSavedPaymentMethods);
        applyIfNotNull(p.getDiscountCredits(), u::setDiscountCredits);

        applyIfNotNull(p.getNotifyPush(), u::setNotifyPush);
        applyIfNotNull(p.getNotifyEmail(), u::setNotifyEmail);
        applyIfNotNull(p.getNotifySms(), u::setNotifySms);
        applyIfNotNull(p.getNotifyTrips(), u::setNotifyTrips);
        applyIfNotNull(p.getNotifyMessages(), u::setNotifyMessages);
        applyIfNotNull(p.getNotifyPromotions(), u::setNotifyPromotions);

        applyIfNotNull(p.getConnectedSocialAccounts(), u::setConnectedSocialAccounts);
        applyIfNotNull(p.getShareBookingHistoryWithAgents(), u::setShareBookingHistoryWithAgents);
        applyIfNotNull(p.getShareProfileWithCoHosts(), u::setShareProfileWithCoHosts);
        applyIfNotNull(p.getAllowProfileSearch(), u::setAllowProfileSearch);
    }

    /* -------- Apply Host-level settings to a User -------- */

    private static void applyHostSettings(User u, UserSettingsDto p, boolean allowed) {
        if (!allowed) return;
        applyIfNotNull(p.getHostCoHostIds(), u::setHostCoHostIds);
        applyIfNotNull(p.getHostCoHostPermissions(), u::setHostCoHostPermissions);
    }

    /* -------- Apply Listing settings -------- */

    private static void applyListingSettings(Listing l, ListingSettingsDto p) {
        applyIfNotNull(p.getTitle(), l::setTitle);
        applyIfNotNull(p.getDescription(), l::setDescription);
        applyIfNotNull(p.getPropertyType(), l::setPropertyType);
        applyIfNotNull(p.getAddress(), l::setAddress);
        applyIfNotNull(p.getCity(), l::setCity);
        applyIfNotNull(p.getCountry(), l::setCountry);
        applyIfNotNull(p.getFloor(), l::setFloor);
        applyIfNotNull(p.getSquareMeters(), l::setSquareMeters);
        applyIfNotNull(p.getLatitude(), l::setLatitude);
        applyIfNotNull(p.getLongitude(), l::setLongitude);
        applyIfNotNull(p.getListingPublished(), l::setListingPublished);

        applyIfNotNull(p.getPrice(), l::setPrice);
        applyIfNotNull(p.getCurrency(), l::setCurrency);
        applyIfNotNull(p.getCleaningFee(), l::setCleaningFee);
        applyIfNotNull(p.getServiceFeePercent(), l::setServiceFeePercent);
        applyIfNotNull(p.getWeeklyDiscountPercent(), l::setWeeklyDiscountPercent);
        applyIfNotNull(p.getMonthlyDiscountPercent(), l::setMonthlyDiscountPercent);
        applyIfNotNull(p.getExtraGuestFee(), l::setExtraGuestFee);
        applyIfNotNull(p.getPetFee(), l::setPetFee);
        applyIfNotNull(p.getMinPrice(), l::setMinPrice);
        applyIfNotNull(p.getMaxPrice(), l::setMaxPrice);

        applyIfNotNull(p.getInstantBookEnabled(), l::setInstantBookEnabled);
        applyIfNotNull(p.getMinStayNights(), l::setMinStayNights);
        applyIfNotNull(p.getMaxStayNights(), l::setMaxStayNights);
        applyIfNotNull(p.getAdvanceNoticeHours(), l::setAdvanceNoticeHours);
        applyIfNotNull(p.getBookingWindowDays(), l::setBookingWindowDays);
        applyIfNotNull(p.getCheckInTime(), l::setCheckInTime);
        applyIfNotNull(p.getCheckOutTime(), l::setCheckOutTime);
        applyIfNotNull(p.getAllowPets(), l::setAllowPets);
        applyIfNotNull(p.getAllowSmoking(), l::setAllowSmoking);
        applyIfNotNull(p.getAllowParties(), l::setAllowParties);
        applyIfNotNull(p.getRequireGuestId(), l::setRequireGuestId);
        applyIfNotNull(p.getCustomRules(), l::setCustomRules);

        applyIfNotNull(p.getCoHostIds(), l::setCoHostIds);
        applyIfNotNull(p.getCoHostPermissions(), l::setCoHostPermissions);
    }

    private void applyAdminBusinessSettings(User u, AdminUserSettingsDto p) {
        applyIfNotNull(p.getBusinessDisplayName(), u::setBusinessDisplayName);
        applyIfNotNull(p.getTeamRole(), u::setTeamRole);
        if (p.getB2bCompanyId() != null) {
            B2bCompany company = b2bCompanyRepository.findById(p.getB2bCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("B2bCompany", "id", p.getB2bCompanyId()));
            u.setB2bCompany(company);
        }
    }

    private static void applyAdminTaxSettings(User u, AdminUserSettingsDto p) {
        applyIfNotNull(p.getTaxpayerNumber(), u::setTaxpayerNumber);
        applyIfNotNull(p.getTaxpayerName(), u::setTaxpayerName);
        applyIfNotNull(p.getTaxpayerAddress(), u::setTaxpayerAddress);
        applyIfNotNull(p.getTaxpayerCountry(), u::setTaxpayerCountry);
        applyIfNotNull(p.getLegalOwnerName(), u::setLegalOwnerName);
        applyIfNotNull(p.getLegalOwnerEmail(), u::setLegalOwnerEmail);
        applyIfNotNull(p.getTaxDocuments(), u::setTaxDocuments);
    }

    private static void applyAdminTeamSettings(User u, AdminUserSettingsDto p, User admin) {
        applyIfNotNull(p.getTeamMemberIds(), u::setTeamMemberIds);
        applyIfNotNull(p.getTeamPermissions(), u::setTeamPermissions);
    }

    private static void applyAccountStatus(User u, AdminUserSettingsDto p, User admin) {
        if (p.getAccountStatus() == null) return;
        AccountStatus prev = u.getAccountStatus();
        u.setAccountStatus(p.getAccountStatus());
        if (p.getAccountStatus() == AccountStatus.DEACTIVATED || p.getAccountStatus() == AccountStatus.SUSPENDED || p.getAccountStatus() == AccountStatus.BANNED) {
            if (prev == AccountStatus.ACTIVE || prev == AccountStatus.PENDING_KYC) {
                u.setDeactivatedAt(LocalDateTime.now());
            }
            u.setDeactivationReason(p.getDeactivationReason());
            u.setDeactivatedByUserId(admin.getId());
        } else if (p.getAccountStatus() == AccountStatus.ACTIVE && (prev == AccountStatus.DEACTIVATED || prev == AccountStatus.SUSPENDED)) {
            u.setDeactivatedAt(null);
            u.setDeactivationReason(null);
            u.setDeactivatedByUserId(null);
        }
    }
}
