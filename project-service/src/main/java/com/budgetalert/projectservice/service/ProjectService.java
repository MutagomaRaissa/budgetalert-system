package com.budgetalert.projectservice.service;

import com.budgetalert.projectservice.dto.CreateProjectRequest;
import com.budgetalert.projectservice.dto.CreateResourceRequest;
import com.budgetalert.projectservice.dto.ProjectResponse;
import com.budgetalert.projectservice.dto.ResourceResponse;
import com.budgetalert.projectservice.dto.UpdateProjectRequest;
import com.budgetalert.projectservice.dto.UpdateProjectStatusRequest;
import com.budgetalert.projectservice.dto.UpdateResourceRequest;
import com.budgetalert.projectservice.exception.ResourceNotFoundException;
import com.budgetalert.projectservice.model.Project;
import com.budgetalert.projectservice.model.ProjectResource;
import com.budgetalert.projectservice.model.ProjectStatus;
import com.budgetalert.projectservice.model.User;
import com.budgetalert.projectservice.repository.ProjectRepository;
import com.budgetalert.projectservice.repository.ProjectResourceRepository;
import com.budgetalert.projectservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public ProjectResponse createProject(String ownerEmail, CreateProjectRequest request) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        Project project = Project.builder()
            .name(request.getName())
            .description(request.getDescription())
            .category(request.getCategory())
            .cloudProvider(request.getCloudProvider())
            .monthlyBudget(request.getMonthlyBudget())
            .annualBudget(request.getAnnualBudget())
            .ownerId(owner.getId())
            .ownerEmail(owner.getEmail())
            .status(ProjectStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();

        return map(projectRepository.save(project));
    }

    public ProjectResponse updateProject(String ownerEmail, String projectId, UpdateProjectRequest request) {
        Project project = requireOwnedProject(projectId, ownerEmail);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setCategory(request.getCategory());
        project.setCloudProvider(request.getCloudProvider());
        project.setMonthlyBudget(request.getMonthlyBudget());
        project.setAnnualBudget(request.getAnnualBudget());
        return map(projectRepository.save(project));
    }

    public void deleteProject(String ownerEmail, String projectId) {
        Project project = requireOwnedProject(projectId, ownerEmail);
        projectRepository.delete(project);
    }

    public ResourceResponse addResource(String ownerEmail, String projectId, CreateResourceRequest request) {
        Project project = requireOwnedProject(projectId, ownerEmail);

        ProjectResource resource = ProjectResource.builder()
            .project(project)
            .resourceType(request.getResourceType())
            .vmSku(request.getVmSku())
            .vcpu(request.getVcpu())
            .ramGb(request.getRamGb())
            .computeUsagePattern(request.getComputeUsagePattern())
            .customHoursPerMonth(request.getCustomHoursPerMonth())
            .storageTier(request.getStorageTier())
            .storageGb(request.getStorageGb())
            .monthlyEgressGb(request.getMonthlyEgressGb())
            .active(request.getActive() != null ? request.getActive() : true)
            .build();

        return map(resourceRepository.save(resource));
    }

    public ResourceResponse updateResource(String ownerEmail, String projectId, String resourceId, UpdateResourceRequest request) {
        Project project = requireOwnedProject(projectId, ownerEmail);
        ProjectResource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (!resource.getProject().getId().equals(project.getId())) {
            throw new ResourceNotFoundException("Resource not found in project");
        }

        resource.setResourceType(request.getResourceType());
        resource.setVmSku(request.getVmSku());
        resource.setVcpu(request.getVcpu());
        resource.setRamGb(request.getRamGb());
        resource.setComputeUsagePattern(request.getComputeUsagePattern());
        resource.setCustomHoursPerMonth(request.getCustomHoursPerMonth());
        resource.setStorageTier(request.getStorageTier());
        resource.setStorageGb(request.getStorageGb());
        resource.setMonthlyEgressGb(request.getMonthlyEgressGb());
        resource.setActive(request.getActive() != null ? request.getActive() : true);

        return map(resourceRepository.save(resource));
    }

    public void deleteResource(String ownerEmail, String projectId, String resourceId) {
        Project project = requireOwnedProject(projectId, ownerEmail);
        ProjectResource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (!resource.getProject().getId().equals(project.getId())) {
            throw new ResourceNotFoundException("Resource not found in project");
        }

        resourceRepository.delete(resource);
    }

    public ProjectResponse updateProjectStatus(String ownerEmail, String projectId, UpdateProjectStatusRequest request) {
        Project project = requireOwnedProject(projectId, ownerEmail);
        project.setStatus(request.getStatus());

        if (request.getStatus() == ProjectStatus.PAUSED || request.getStatus() == ProjectStatus.ARCHIVED) {
            project.getResources().forEach(resource -> resource.setActive(false));
        }

        return map(projectRepository.save(project));
    }

    public List<ProjectResponse> getProjects(String ownerEmail, String category, ProjectStatus status) {
        List<Project> projects;

        if (category != null && !category.isBlank()) {
            projects = projectRepository.findByOwnerEmailAndCategoryIgnoreCaseOrderByCreatedAtDesc(ownerEmail, category);
        } else if (status != null) {
            projects = projectRepository.findByOwnerEmailAndStatusOrderByCreatedAtDesc(ownerEmail, status);
        } else {
            projects = projectRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        }

        return projects.stream().map(this::map).toList();
    }

    public List<ProjectResponse> getCoverageFeed() {
        return projectRepository.findByStatus(ProjectStatus.ACTIVE).stream()
            .map(this::map)
            .toList();
    }

    private Project requireOwnedProject(String projectId, String ownerEmail) {
        return projectRepository.findByIdAndOwnerEmail(projectId, ownerEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private ProjectResponse map(Project project) {
        return ProjectResponse.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .category(project.getCategory())
            .cloudProvider(project.getCloudProvider())
            .monthlyBudget(project.getMonthlyBudget())
            .annualBudget(project.getAnnualBudget())
            .ownerEmail(project.getOwnerEmail())
            .status(project.getStatus())
            .createdAt(project.getCreatedAt())
            .resources(project.getResources().stream().map(this::map).toList())
            .build();
    }

    private ResourceResponse map(ProjectResource resource) {
        return ResourceResponse.builder()
            .id(resource.getId())
            .resourceType(resource.getResourceType())
            .vmSku(resource.getVmSku())
            .vcpu(resource.getVcpu())
            .ramGb(resource.getRamGb())
            .computeUsagePattern(resource.getComputeUsagePattern())
            .customHoursPerMonth(resource.getCustomHoursPerMonth())
            .storageTier(resource.getStorageTier())
            .storageGb(resource.getStorageGb())
            .monthlyEgressGb(resource.getMonthlyEgressGb())
            .active(resource.getActive())
            .build();
    }
}
