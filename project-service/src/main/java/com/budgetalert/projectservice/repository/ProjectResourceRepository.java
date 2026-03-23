package com.budgetalert.projectservice.repository;
import com.budgetalert.projectservice.model.ProjectResource; 
import org.springframework.data.jpa.repository.JpaRepository; 
public interface ProjectResourceRepository extends JpaRepository<ProjectResource,String>{}
