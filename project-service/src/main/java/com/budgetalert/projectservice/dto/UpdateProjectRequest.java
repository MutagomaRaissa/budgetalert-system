package com.budgetalert.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProjectRequest {
  @NotBlank
  private String name;

  private String description;

  @NotBlank
  private String category;

  @NotBlank
  private String cloudProvider;

  @NotNull
  private Double monthlyBudget;

  private Double annualBudget;
}
