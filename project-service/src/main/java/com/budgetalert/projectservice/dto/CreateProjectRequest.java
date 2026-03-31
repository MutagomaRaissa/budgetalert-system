package com.budgetalert.projectservice.dto;
import jakarta.validation.constraints.*; 
import lombok.*;
  
  @Getter @Setter 
  public class CreateProjectRequest { 
  @NotBlank private String name;
  private String description;
  @NotBlank private String category;
  @NotBlank private String cloudProvider;
  @NotNull private Double monthlyBudget;
  private Double annualBudget; 
  }
