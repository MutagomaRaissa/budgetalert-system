package com.budgetalert.projectservice.repository;

import com.budgetalert.projectservice.model.Project;
import com.budgetalert.projectservice.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<Project> findByOwnerEmailAndStatusOrderByCreatedAtDesc(String ownerEmail, ProjectStatus status);

    List<Project> findByOwnerEmailAndCategoryIgnoreCaseOrderByCreatedAtDesc(String ownerEmail, String category);

    List<Project> findByStatus(ProjectStatus status);

    Optional<Project> findByIdAndOwnerEmail(String id, String ownerEmail);
}
