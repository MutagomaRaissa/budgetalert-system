package com.budgetalert.alertservice.event; 
import lombok.*;
@Getter @Setter
  @NoArgsConstructor
  @AllArgsConstructor 
  @Builder 
  public class BudgetAlertEvent {
    private String projectId; 
    private String projectName;
    private String ownerEmail; 
    private String category;
    private Double monthlyBudget;
    private Double forecastCost;
    private Double usagePercentage;
    private String severity; }
