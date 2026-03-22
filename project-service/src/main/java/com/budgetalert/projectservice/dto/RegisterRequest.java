package com.budgetalert.projectservice.dto;
import jakarta.validation.constraints.*; import lombok.*;
@Getter @Setter public class RegisterRequest { @Email @NotBlank private String email; @NotBlank private String password; @NotBlank private String fullName; }