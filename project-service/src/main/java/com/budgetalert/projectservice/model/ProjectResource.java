package com.budgetalert.projectservice.model;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name="project_resources") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectResource {
 @Id @GeneratedValue(strategy = GenerationType.UUID) private String id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="project_id", nullable=false) private Project project;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private ResourceType resourceType;
 private String vmSku; private Integer vcpu; private Integer ramGb;
 @Enumerated(EnumType.STRING) private ComputeUsagePattern computeUsagePattern;
 private Integer customHoursPerMonth;
 private String storageTier; private Integer storageGb; private Integer monthlyEgressGb;
 @Column(nullable=false) private Boolean active;
}