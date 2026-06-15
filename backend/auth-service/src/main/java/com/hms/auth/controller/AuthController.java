package com.hms.auth.controller;

import com.hms.auth.dto.AuthRequest;
import com.hms.auth.dto.AuthResponse;
import com.hms.auth.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // In-memory mock database of users for demonstration
    private final Map<String, MockUser> mockUsers = new HashMap<>();

    public AuthController(JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;

        // Populate mock users (password is "password")
        String encodedPassword = passwordEncoder.encode("password");
        mockUsers.put("doctor_alpha", new MockUser("doctor_alpha", encodedPassword, "tenant_a", List.of("ROLE_DOCTOR")));
        mockUsers.put("doctor_beta", new MockUser("doctor_beta", encodedPassword, "tenant_b", List.of("ROLE_DOCTOR")));
        mockUsers.put("admin", new MockUser("admin", encodedPassword, "tenant_a", List.of("ROLE_ADMIN")));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        MockUser user = mockUsers.get(request.username());
        if (user != null && passwordEncoder.matches(request.password(), user.password()) && user.tenantId().equalsIgnoreCase(request.tenantId())) {
            String token = jwtUtil.generateToken(user.username(), user.tenantId(), user.roles());
            long expiresAt = System.currentTimeMillis() + 86400000; // 24 hours
            return ResponseEntity.ok(new AuthResponse(token, expiresAt));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials or tenant mismatch");
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            MockUser user = mockUsers.get(username);
            if (user != null && jwtUtil.validateToken(token, user.username())) {
                Map<String, Object> validationResponse = new HashMap<>();
                validationResponse.put("username", username);
                validationResponse.put("tenantId", jwtUtil.extractTenantId(token));
                validationResponse.put("roles", jwtUtil.extractRoles(token));
                validationResponse.put("valid", true);
                return ResponseEntity.ok(validationResponse);
            }
        } catch (Exception e) {
            // Token parsing or signature validation failed
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
    }

    // Helper static class for in-memory users
    private record MockUser(
        String username,
        String password,
        String tenantId,
        List<String> roles
    ) {}
}
