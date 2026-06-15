package com.hms.auth.dto;

public record AuthResponse(
    String token,
    long expiresAt
) {}
