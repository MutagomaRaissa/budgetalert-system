package com.budgetalert.projectservice.model;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
 @Id @GeneratedValue(strategy = GenerationType.UUID) private String id;
 @Column(nullable=false, unique=true) private String email;
 @Column(nullable=false) private String passwordHash;
 @Column(nullable=false) private String fullName;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
 @Column(nullable=false) private LocalDateTime createdAt;
}