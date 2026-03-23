package com.budgetalert.coverageservice.dto; 
import lombok.*; 
import java.time.LocalDate; 
@Getter
  @Setter 
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class CoverageResponse {
    private String projectId; 
    private String projectName; 
    private String category; 
    private LocalDate snapshotDate; 
    private Double dailyCost; 
    private Double monthToDateCost; 
    private Double forecastCost; 
    private Double monthlyBudget; 
    private Double budgetUsagePercentage; 
    private String severity; }
