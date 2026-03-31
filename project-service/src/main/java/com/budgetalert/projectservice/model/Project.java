package com.budgetalert.projectservice.model;
import jakarta.persistence.*; 
import lombok.*; 
import java.time.LocalDateTime; 
import java.util.*;
@Entity 
 @Table(name="projects")
 @Getter @Setter 
 @NoArgsConstructor @AllArgsConstructor 
 @Builder
public class Project {
 @Id @GeneratedValue(strategy = GenerationType.UUID) 
 private String id;
 @Column(nullable=false) 
 private String name;
 private String description;
 @Column(nullable=false) 
 private String category;
 @Column(nullable=false)
 private String cloudProvider;
 @Column(nullable=false)
 private Double monthlyBudget;
 private Double annualBudget;
 @Column(nullable=false) 
 private String ownerId;
 @Column(nullable=false)
 private String ownerEmail;
 @Enumerated(EnumType.STRING)
 @Column(nullable=false) 
 private ProjectStatus status;
 @Column(nullable=false) 
 private LocalDateTime createdAt;
 @OneToMany(mappedBy="project", cascade=CascadeType.ALL, orphanRemoval=true)
 @Builder.Default
 private List<ProjectResource> resources = new ArrayList<>();
}
