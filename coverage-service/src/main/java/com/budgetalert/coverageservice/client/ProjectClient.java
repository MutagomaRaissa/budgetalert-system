package com.budgetalert.coverageservice.client;
import com.budgetalert.coverageservice.dto.ProjectFeedResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.*;
@FeignClient(name="project-service")
public interface ProjectClient {
    @GetMapping("/api/v1/projects/coverage-feed")
    List<ProjectFeedResponse> getCoverageFeed();
}