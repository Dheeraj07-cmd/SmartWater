package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.request.GoogleLoginRequest;
import com.codecrew.smartwater.dto.request.LoginRequest;
import com.codecrew.smartwater.dto.request.RegisterRequest;
import com.codecrew.smartwater.dto.response.AuthResponse;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.model.entity.User;
import com.codecrew.smartwater.model.enums.Role;
import com.codecrew.smartwater.repository.UserRepository;
import com.codecrew.smartwater.security.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    @Value("${application.security.google.client-id:}")
    private String googleClientId;

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = (User) authentication.getPrincipal();
        return AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .userName((user.getFirstName() + " " + user.getLastName()).trim())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ApiException("Email is already taken!", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.ROLE_RESIDENT)
                .build();

        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerRequest.getEmail(), registerRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .userName((user.getFirstName() + " " + user.getLastName()).trim())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String givenName = payload.get("given_name") != null ? (String) payload.get("given_name") : "Resident";
                String familyName = payload.get("family_name") != null ? (String) payload.get("family_name") : "";

                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .firstName(givenName)
                            .lastName(familyName)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.ROLE_RESIDENT)
                            .build();
                    return userRepository.save(newUser);
                });

                Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
                String jwt = tokenProvider.generateToken(authentication);

                return AuthResponse.builder()
                        .token(jwt)
                        .id(user.getId())
                        .userName((user.getFirstName() + " " + user.getLastName()).trim())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build();
            } else {
                throw new ApiException("Invalid Google ID Token", HttpStatus.UNAUTHORIZED);
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Failed to authenticate with Google: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}