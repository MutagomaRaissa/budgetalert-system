package com.budgetalert.projectservice.service;
import com.budgetalert.projectservice.dto.*; import com.budgetalert.projectservice.exception.BadRequestException; import com.budgetalert.projectservice.model.*; import com.budgetalert.projectservice.repository.UserRepository; import com.budgetalert.projectservice.security.JwtService; import lombok.RequiredArgsConstructor; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service; import java.time.LocalDateTime;
@Service @RequiredArgsConstructor public class AuthService {
 private final UserRepository userRepository;
 private final PasswordEncoder passwordEncoder;
 private final JwtService jwtService;
 public AuthResponse register(RegisterRequest request){
     if(userRepository.findByEmail(request.getEmail()).isPresent())
         throw new BadRequestException("Email already registered");
     User user = userRepository.save(User.builder()
             .email(request.getEmail())
             .passwordHash(passwordEncoder.encode(request.getPassword()))
             .fullName(request.getFullName())
             .role(Role.PROJECT_OWNER)
             .createdAt(LocalDateTime.now())
             .build());
     return jwtService.generateAuthResponse(user);
 }
 public AuthResponse login(LoginRequest request)
 {
     User user=userRepository.findByEmail(request.getEmail()).orElseThrow(()->new BadRequestException("Invalid credentials")); if(!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) throw new BadRequestException("Invalid credentials"); return jwtService.generateAuthResponse(user); }
}
