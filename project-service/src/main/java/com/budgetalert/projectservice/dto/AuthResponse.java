package com.budgetalert.projectservice.dto;
public record AuthResponse(String token, String tokenType, long expiresInSeconds) {}
