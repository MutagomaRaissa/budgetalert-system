package com.budgetalert.projectservice.controller;
import com.budgetalert.projectservice.dto.*; import com.budgetalert.projectservice.service.AuthService; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register")
    @Operation(summary = "Register a new project owner", security = {})
    public AuthResponse register(@Valid @RequestBody RegisterRequest request){
        return authService.register(request); }
    @PostMapping("/login")
    @Operation(summary = "Login and receive a JWT", security = {})
    public AuthResponse login(@Valid @RequestBody LoginRequest request)
    { return authService.login(request); }}
