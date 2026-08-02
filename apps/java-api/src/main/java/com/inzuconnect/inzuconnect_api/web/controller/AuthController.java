package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.KycStatus;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import com.inzuconnect.inzuconnect_api.security.JwtService;
import com.inzuconnect.inzuconnect_api.security.OtpService;
import com.inzuconnect.inzuconnect_api.service.SmsNotificationService;
import com.inzuconnect.inzuconnect_api.web.dto.AuthErrorDto;
import com.inzuconnect.inzuconnect_api.web.dto.AuthResponseDto;
import com.inzuconnect.inzuconnect_api.web.dto.AuthSuccessDto;
import com.inzuconnect.inzuconnect_api.web.dto.LoginDto;
import com.inzuconnect.inzuconnect_api.web.dto.OtpSendDto;
import com.inzuconnect.inzuconnect_api.web.dto.OtpVerifyDto;
import com.inzuconnect.inzuconnect_api.web.dto.RegisterDto;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final SmsNotificationService smsNotificationService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          OtpService otpService,
                          SmsNotificationService smsNotificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.smsNotificationService = smsNotificationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto dto) {
        Optional<User> optionalUser = userRepository.findByEmail(dto.getEmail());

        if (optionalUser.isEmpty() || !passwordEncoder.matches(dto.getPassword(), optionalUser.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthErrorDto("Identifiants invalides"));
        }

        User user = optionalUser.get();
        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDto dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new AuthErrorDto("Cet email est déjà utilisé"));
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setPhone(dto.getPhone());
        user.setKycStatus(KycStatus.NONE);

        userRepository.save(user);
        String token = jwtService.generateToken(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(buildAuthResponse(user, token));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpSendDto dto) {
        Optional<User> optionalUser = userRepository.findByPhone(dto.getPhone());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthErrorDto("Aucun compte enregistré avec ce numéro de téléphone."));
        }

        String code = otpService.generateOtp(dto.getPhone());
        otpService.storeOtp(dto.getPhone(), code, 10);

        String message = "InzuConnect: Votre code de vérification est " + code + ". Il expire dans 10 minutes.";
        smsNotificationService.sendSms(dto.getPhone(), message);
        log.info("[SMS SIMULÉ] OTP envoyé au {}: code={}", dto.getPhone(), code);

        return ResponseEntity.ok(new AuthSuccessDto(true, "OTP envoyé"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyDto dto) {
        boolean otpValid = otpService.verifyOtp(dto.getPhone(), dto.getCode());
        if (!otpValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthErrorDto("Code OTP invalide ou expiré."));
        }

        Optional<User> optionalUser = userRepository.findByPhone(dto.getPhone());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthErrorDto("Utilisateur non trouvé"));
        }

        User user = optionalUser.get();
        if (!user.isPhoneVerified()) {
            user.setPhoneVerified(true);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    @org.springframework.web.bind.annotation.GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            user = userRepository.findByPhone(email);
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
