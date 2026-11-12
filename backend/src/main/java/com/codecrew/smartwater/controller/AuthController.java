package com.codecrew.smartwater.controller;

import com.codecrew.smartwater.common.ApiResponse;
import com.codecrew.smartwater.dto.request.GoogleLoginRequest;
import com.codecrew.smartwater.dto.request.LoginRequest;
import com.codecrew.smartwater.dto.request.RegisterRequest;
import com.codecrew.smartwater.dto.request.ResetPasswordRequest;
import com.codecrew.smartwater.dto.response.AuthResponse;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.PasswordResetToken;
import com.codecrew.smartwater.model.entity.User;
import com.codecrew.smartwater.repository.PasswordResetTokenRepository;
import com.codecrew.smartwater.repository.UserRepository;
import com.codecrew.smartwater.service.AuthService;
import com.codecrew.smartwater.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration and login")
public class AuthController {

    @Value("${application.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthController(AuthService authService,
                          UserRepository userRepository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          PasswordEncoder passwordEncoder,
                          EmailService emailService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates a user and returns a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("User logged in successfully", authResponse));
    }

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Registers a new resident user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse authResponse = authService.registerUser(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authResponse));
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google", description = "Authenticates a user via Google OAuth2 ID Token")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse authResponse = authService.authenticateWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.success("User authenticated with Google successfully", authResponse));
    }

    @Transactional
    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset link via email")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @RequestParam(required = false) String email,
            @RequestBody(required = false) Map<String, String> body) {

        String targetEmail = (email != null && !email.isBlank())
                ? email.trim()
                : (body != null && body.get("email") != null ? body.get("email").trim() : null);

        if (targetEmail == null || targetEmail.isBlank()) {
            throw new ApiException("Email address is required", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", targetEmail));

        // Clean old tokens and flush immediately so the new token insert never collides
        passwordResetTokenRepository.deleteByUser_Id(user.getId());
        passwordResetTokenRepository.flush();

        // Generate Token (Valid for 15 mins)
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + token;

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetUrl);
        System.out.println("DEBUG RESET URL: " + resetUrl);

        return ResponseEntity.ok(ApiResponse.success("Password reset link sent to your email.", null));
    }

    @Transactional
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using a valid token")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken().trim())
                .orElseThrow(() -> new ApiException("Invalid reset token", HttpStatus.BAD_REQUEST));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new ApiException("Token has expired. Please request a new reset link.", HttpStatus.BAD_REQUEST);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);

        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully.", null));
    }
}