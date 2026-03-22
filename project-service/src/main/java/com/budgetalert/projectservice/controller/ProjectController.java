package com.budgetalert.projectservice.controller;

import com.budgetalert.projectservice.dto.CreateProjectRequest;
import com.budgetalert.projectservice.dto.CreateResourceRequest;
import com.budgetalert.projectservice.dto.ProjectResponse;
import com.budgetalert.projectservice.dto.ResourceResponse;
import com.budgetalert.projectservice.dto.UpdateProjectRequest;
import com.budgetalert.projectservice.dto.UpdateProjectStatusRequest;
import com.budgetalert.projectservice.dto.UpdateResourceRequest;
import com.budgetalert.projectservice.model.ProjectStatus;
import com.budgetalert.projectservice.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @PostMapping
    public ProjectResponse createProject(Authentication authentication, @Valid @RequestBody CreateProjectRequest request) {
        return projectService.createProject(authentication.getName(), request);
    }

    @PutMapping("/{projectId}")
    public ProjectResponse updateProject(
        Authentication authentication,
        @PathVariable String projectId,
        @Valid @RequestBody UpdateProjectRequest request
    ) {
        return projectService.updateProject(authentication.getName(), projectId, request);
    }

    @DeleteMapping("/{projectId}")
    public void deleteProject(Authentication authentication, @PathVariable String projectId) {
        projectService.deleteProject(authentication.getName(), projectId);
    }

    @PostMapping("/{projectId}/resources")
    public ResourceResponse addResource(
        Authentication authentication,
        @PathVariable String projectId,
        @Valid @RequestBody CreateResourceRequest request
    ) {
        return projectService.addResource(authentication.getName(), projectId, request);
    }

    @PutMapping("/{projectId}/resources/{resourceId}")
    public ResourceResponse updateResource(
        Authentication authentication,
        @PathVariable String projectId,
        @PathVariable String resourceId,
        @Valid @RequestBody UpdateResourceRequest request
    ) {
        return projectService.updateResource(authentication.getName(), projectId, resourceId, request);
    }

    @DeleteMapping("/{projectId}/resources/{resourceId}")
    public void deleteResource(Authentication authentication, @PathVariable String projectId, @PathVariable String resourceId) {
        projectService.deleteResource(authentication.getName(), projectId, resourceId);
    }

    @PatchMapping("/{projectId}/status")
    public ProjectResponse updateProjectStatus(
        Authentication authentication,
        @PathVariable String projectId,
        @Valid @RequestBody UpdateProjectStatusRequest request
    ) {
        return projectService.updateProjectStatus(authentication.getName(), projectId, request);
    }

    @GetMapping
    public List<ProjectResponse> getProjects(
        Authentication authentication,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) ProjectStatus status
    ) {
        return projectService.getProjects(authentication.getName(), category, status);
    }

    @GetMapping("/coverage-feed")
    public List<ProjectResponse> getCoverageFeed() {
        return projectService.getCoverageFeed();
    }
}
