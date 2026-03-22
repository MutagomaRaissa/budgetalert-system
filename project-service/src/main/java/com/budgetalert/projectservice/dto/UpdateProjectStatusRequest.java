package com.budgetalert.projectservice.dto;

import com.budgetalert.projectservice.model.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProjectStatusRequest {
  @NotNull
  private ProjectStatus status;
}
