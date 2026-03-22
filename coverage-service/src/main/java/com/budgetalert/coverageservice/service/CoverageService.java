package com.budgetalert.coverageservice.service;

import com.budgetalert.coverageservice.client.ProjectClient;
import com.budgetalert.coverageservice.config.RabbitMqConfig;
import com.budgetalert.coverageservice.dto.CoverageResponse;
import com.budgetalert.coverageservice.dto.ProjectFeedResponse;
import com.budgetalert.coverageservice.event.BudgetAlertEvent;
import com.budgetalert.coverageservice.model.CoverageSnapshot;
import com.budgetalert.coverageservice.repository.CoverageSnapshotRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoverageService {
    private final ProjectClient projectClient;
    private final PricingService pricingService;
    private final CoverageSnapshotRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public List<CoverageResponse> calculateDailyCoverage() {
        LocalDate today = LocalDate.now();
        return projectClient.getCoverageFeed().stream()
            .map(project -> calculateForProject(project, today))
            .toList();
    }

    public List<CoverageResponse> getCoverageByProject(String projectId) {
        return repository.findByProjectIdOrderBySnapshotDateDesc(projectId).stream()
            .map(this::map)
            .toList();
    }

    private CoverageResponse calculateForProject(ProjectFeedResponse project, LocalDate today) {
        double monthlyCost = project.getResources().stream()
            .filter(resource -> Boolean.TRUE.equals(resource.getActive()))
            .mapToDouble(pricingService::calculateMonthlyResourceCost)
            .sum();
        int daysInMonth = YearMonth.now().lengthOfMonth();
        int dayOfMonth = today.getDayOfMonth();
        double dailyCost = monthlyCost / daysInMonth;
        double monthToDate = dailyCost * dayOfMonth;
        double forecast = (monthToDate / dayOfMonth) * daysInMonth;
        double usage = project.getMonthlyBudget() > 0
            ? (forecast / project.getMonthlyBudget()) * 100
            : 0.0;
        String severity = usage >= 120 ? "CRITICAL" : usage >= 100 ? "HIGH" : usage >= 80 ? "WARNING" : "OK";

        CoverageSnapshot snapshot = CoverageSnapshot.builder()
            .projectId(project.getId())
            .projectName(project.getName())
            .ownerEmail(project.getOwnerEmail())
            .category(project.getCategory())
            .snapshotDate(today)
            .dailyCost(dailyCost)
            .monthToDateCost(monthToDate)
            .forecastCost(forecast)
            .monthlyBudget(project.getMonthlyBudget())
            .budgetUsagePercentage(usage)
            .severity(severity)
            .build();

        repository.save(snapshot);

        if (!"OK".equals(severity)) {
            publishAlert(snapshot);
        }

        return map(snapshot);
    }

    private void publishAlert(CoverageSnapshot snapshot) {
        BudgetAlertEvent event = BudgetAlertEvent.builder()
            .projectId(snapshot.getProjectId())
            .projectName(snapshot.getProjectName())
            .ownerEmail(snapshot.getOwnerEmail())
            .category(snapshot.getCategory())
            .monthlyBudget(snapshot.getMonthlyBudget())
            .forecastCost(snapshot.getForecastCost())
            .usagePercentage(snapshot.getBudgetUsagePercentage())
            .severity(snapshot.getSeverity())
            .build();

        try {
            rabbitTemplate.convertAndSend(
                RabbitMqConfig.BUDGET_ALERT_QUEUE,
                objectMapper.writeValueAsString(event)
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize budget alert event", exception);
        }
    }

    private CoverageResponse map(CoverageSnapshot snapshot) {
        return CoverageResponse.builder()
            .projectId(snapshot.getProjectId())
            .projectName(snapshot.getProjectName())
            .category(snapshot.getCategory())
            .snapshotDate(snapshot.getSnapshotDate())
            .dailyCost(snapshot.getDailyCost())
            .monthToDateCost(snapshot.getMonthToDateCost())
            .forecastCost(snapshot.getForecastCost())
            .monthlyBudget(snapshot.getMonthlyBudget())
            .budgetUsagePercentage(snapshot.getBudgetUsagePercentage())
            .severity(snapshot.getSeverity())
            .build();
    }
}
