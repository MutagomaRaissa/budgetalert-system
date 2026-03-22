package com.budgetalert.projectservice.dto;

import com.budgetalert.projectservice.model.ComputeUsagePattern;
import com.budgetalert.projectservice.model.ResourceType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateResourceRequest {
  @NotNull
  private ResourceType resourceType;

  private String vmSku;
  private Integer vcpu;
  private Integer ramGb;
  private ComputeUsagePattern computeUsagePattern;
  private Integer customHoursPerMonth;
  private String storageTier;
  private Integer storageGb;
  private Integer monthlyEgressGb;
  private Boolean active;
}
