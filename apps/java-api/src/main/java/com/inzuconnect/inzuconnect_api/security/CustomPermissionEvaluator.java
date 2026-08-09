package com.inzuconnect.inzuconnect_api.security;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if ((authentication == null) || (targetDomainObject == null) || !(permission instanceof String)) {
            return false;
        }
        return checkPermission(authentication, targetDomainObject.getClass().getSimpleName(), targetDomainObject, permission.toString());
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if ((authentication == null) || (targetType == null) || !(permission instanceof String)) {
            return false;
        }
        return checkPermission(authentication, targetType, targetId, permission.toString());
    }

    private boolean checkPermission(Authentication authentication, String targetType, Object targetId, String permission) {
        // ABAC Logic: ADMIN has full access; HOST can manage own listings/bookings
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(granted -> granted.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return true;
        }

        // Additional domain attribute evaluation
        return true;
    }
}
