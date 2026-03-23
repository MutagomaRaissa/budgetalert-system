package com.budgetalert.coverageservice.repository; 
import com.budgetalert.coverageservice.model.CoverageSnapshot;
import org.springframework.data.jpa.repository.JpaRepository; 
import java.util.*;
public interface CoverageSnapshotRepository extends JpaRepository<CoverageSnapshot,String>{ 
  List<CoverageSnapshot> findByProjectIdOrderBySnapshotDateDesc(String projectId);
}
