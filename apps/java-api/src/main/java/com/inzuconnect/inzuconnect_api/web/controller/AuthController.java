package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.KycStatus;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import com.inzuconnect.inzuconnect_api.security.JwtService;
import com.inzuconnect.inzuconnect_api.web.dto.AuthResponseDto;
import com.inzuconnect.inzuconnect_api.web.dto.LoginDto;
import com.inzuconnect.inzuconnect_api.web.dto.RegisterDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto dto) {
        Optional<User> optionalUser = userRepository.findByEmail(dto.getEmail());
        
        if (optionalUser.isEmpty() || !passwordEncoder.matches(dto.getPassword(), optionalUser.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("error", "Identifiants invalides"));
        }

        User user = optionalUser.get();
        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDto dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "Cet email est déjà utilisé"));
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setPhone(dto.getPhone());
        user.setKycStatus(KycStatus.NONE);
        // Les autres champs utilisent leurs valeurs par défaut définies dans l'Entité (GUEST, etc.)

        userRepository.save(user);
        String token = jwtService.generateToken(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(buildAuthResponse(user, token));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp(@RequestBody com.inzuconnect.inzuconnect_api.web.dto.OtpSendDto dto) {
        Optional<User> optionalUser = userRepository.findByPhone(dto.getPhone());
        if (optionalUser.isEmpty()) {
            // Créer un utilisateur fantôme pour la démo mobile
            User demoUser = new User();
            demoUser.setName("Guest Mobile");
            demoUser.setEmail("mobile" + System.currentTimeMillis() + "@inzu.bi");
            demoUser.setPassword(passwordEncoder.encode("secret"));
            demoUser.setPhone(dto.getPhone());
            demoUser.setKycStatus(KycStatus.NONE);
            userRepository.save(demoUser);
        }
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "OTP envoyé"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody com.inzuconnect.inzuconnect_api.web.dto.OtpVerifyDto dto) {
        Optional<User> optionalUser = userRepository.findByPhone(dto.getPhone());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(buildAuthResponse(user, token));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("error", "Utilisateur non trouvé"));
    }

    @org.springframework.web.bind.annotation.GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            user = userRepository.findByPhone(email); // fallback if phone was used as principal
        }
        if (user.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        AuthResponseDto.UserDto dto = AuthResponseDto.UserDto.builder()
                .id(user.get().getId())
                .name(user.get().getName())
                .email(user.get().getEmail())
                .phone(user.get().getPhone())
                .role(user.get().getRole().name())
                .badge(user.get().getBadge().name())
                .build();
        return ResponseEntity.ok(java.util.Map.of("user", dto));
    }

    private AuthResponseDto buildAuthResponse(User user, String token) {
        AuthResponseDto.UserDto userDto = AuthResponseDto.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .badge(user.getBadge().name())
                .phoneVerified(user.isPhoneVerified())
                .kycStatus(user.getKycStatus().name())
                .build();

        return AuthResponseDto.builder()
                .token(token)
                .user(userDto)
                .build();
    }
}
