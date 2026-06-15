package com.hms.auth.dto;

public record AuthRequest(
    String username,
    String password,
    String tenantId
) {}
