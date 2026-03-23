package com.budgetalert.alertservice.model;
import jakarta.persistence.*; 
import lombok.*; 
import java.time.LocalDateTime;
@Entity @Table(name="alerts")
 @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
 public class Alert {
 @Id @GeneratedValue(strategy = GenerationType.UUID)
  private String id;
  @Column(nullable=false)
  private String projectId;
  @Column(nullable=false) 
  private String projectName;
  @Column(nullable=false)
  private String recipientEmail;
  @Column(nullable=false) 
  private String category;
  @Column(nullable=false) 
  private Double forecastCost;
  @Column(nullable=false) 
  private Double monthlyBudget; 
  @Column(nullable=false) 
  private Double usagePercentage;
  @Column(nullable=false) 
  private String severity;
  @Column(nullable=false,length=1000) 
  private String message;
  @Enumerated(EnumType.STRING)
  @Column(nullable=false)
  private AlertStatus status;
  @Column(nullable=false)
  private LocalDateTime createdAt; }
