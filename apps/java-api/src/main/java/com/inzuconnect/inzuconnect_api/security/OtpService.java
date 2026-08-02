package com.inzuconnect.inzuconnect_api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final String OTP_KEY_PREFIX = "otp:";
    private static final int DEFAULT_TTL_MINUTES = 10;
    private static final SecureRandom secureRandom = new SecureRandom();

    private final StringRedisTemplate stringRedisTemplate;
    private final ConcurrentHashMap<String, OtpEntry> fallbackStore;
    private final boolean useRedis;

    private record OtpEntry(String code, long expiresAt) {}

    @Autowired(required = false)
    public OtpService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.fallbackStore = new ConcurrentHashMap<>();
        this.useRedis = stringRedisTemplate != null;
        if (useRedis) {
            log.info("OtpService initialisé avec stockage Redis");
        } else {
            log.warn("OtpService initialisé avec fallback ConcurrentHashMap (mode dev)");
        }
    }

    public String generateOtp(String phone) {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }

    public void storeOtp(String phone, String code, int ttlMinutes) {
        String key = OTP_KEY_PREFIX + phone;
        int ttl = ttlMinutes > 0 ? ttlMinutes : DEFAULT_TTL_MINUTES;

        if (useRedis) {
            try {
                stringRedisTemplate.opsForValue().set(key, code, ttl, TimeUnit.MINUTES);
                log.debug("OTP stocké dans Redis pour {} (TTL: {}min)", phone, ttl);
            } catch (Exception e) {
                log.warn("Échec stockage Redis OTP, utilisation fallback: {}", e.getMessage());
                storeInFallback(key, code, ttl);
            }
        } else {
            storeInFallback(key, code, ttl);
        }
    }

    public void storeOtp(String phone, String code) {
        storeOtp(phone, code, DEFAULT_TTL_MINUTES);
    }

    public boolean verifyOtp(String phone, String code) {
        String key = OTP_KEY_PREFIX + phone;
        String storedCode = null;

        if (useRedis) {
            try {
                storedCode = stringRedisTemplate.opsForValue().get(key);
            } catch (Exception e) {
                log.warn("Échec lecture Redis OTP, utilisation fallback: {}", e.getMessage());
            }
        }

        if (storedCode == null) {
            storedCode = getFromFallback(key);
        }

        if (storedCode != null && storedCode.equals(code)) {
            deleteOtp(phone, key);
            return true;
        }

        return false;
    }

    private void storeInFallback(String key, String code, int ttlMinutes) {
        long expiresAt = System.currentTimeMillis() + (ttlMinutes * 60 * 1000L);
        fallbackStore.put(key, new OtpEntry(code, expiresAt));
        log.debug("OTP stocké dans fallback pour {} (TTL: {}min)", key.replace(OTP_KEY_PREFIX, ""), ttlMinutes);
    }

    private String getFromFallback(String key) {
        OtpEntry entry = fallbackStore.get(key);
        if (entry == null) return null;
        if (System.currentTimeMillis() > entry.expiresAt()) {
            fallbackStore.remove(key);
            return null;
        }
        return entry.code();
    }

    private void deleteOtp(String phone, String key) {
        if (useRedis) {
            try {
                stringRedisTemplate.delete(key);
            } catch (Exception e) {
                log.warn("Échec suppression Redis OTP: {}", e.getMessage());
            }
        }
        fallbackStore.remove(key);
        log.debug("OTP supprimé après vérification pour {}", phone);
    }
}
