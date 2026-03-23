package com.budgetalert.projectservice.security;
import com.budgetalert.projectservice.dto.AuthResponse;
import com.budgetalert.projectservice.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value; 
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey; 
import java.nio.charset.StandardCharsets; 
import java.util.Date;
@Service public class JwtService {
 private final String secret;
 private final long expirationMs;
 private SecretKey key;
 public JwtService(
         @Value("${app.jwt.secret}") String secret,
         @Value("${app.jwt.expiration-ms:86400000}") long expirationMs
 ) {
     this.secret = secret;
     this.expirationMs = expirationMs;
 }
 @PostConstruct
 void init() {
     if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
         throw new IllegalStateException("JWT secret must be at least 32 bytes long");
     }
     this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
 }
 public AuthResponse generateAuthResponse(User user) {
     return new AuthResponse(generateToken(user.getId(), user.getEmail(), user.getRole().name()), "Bearer", expirationMs / 1000);
 }
 public String generateToken(String userId,String email,String role){ return Jwts.builder().subject(email).claim("userId",userId).claim("role",role).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+expirationMs)).signWith(key).compact(); }
 public Claims parse(String token){ return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
}
