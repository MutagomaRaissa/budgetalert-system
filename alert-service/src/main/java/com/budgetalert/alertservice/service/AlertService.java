package com.budgetalert.alertservice.service;

import com.budgetalert.alertservice.dto.AlertResponse;
import com.budgetalert.alertservice.event.BudgetAlertEvent;
import com.budgetalert.alertservice.model.Alert;
import com.budgetalert.alertservice.model.AlertStatus;
import com.budgetalert.alertservice.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {
    private final AlertRepository alertRepository;

    public void createFromEvent(BudgetAlertEvent event) {
        Alert alert = Alert.builder()
            .projectId(event.getProjectId())
            .projectName(event.getProjectName())
            .recipientEmail(event.getOwnerEmail())
            .category(event.getCategory())
            .forecastCost(event.getForecastCost())
            .monthlyBudget(event.getMonthlyBudget())
            .usagePercentage(event.getUsagePercentage())
            .severity(event.getSeverity())
            .message(buildMessage(event))
            .status(AlertStatus.NEW)
            .createdAt(LocalDateTime.now())
            .build();

        alertRepository.save(alert);
    }

    public List<AlertResponse> getAlerts(String ownerEmail) {
        return alertRepository.findByRecipientEmailOrderByCreatedAtDesc(ownerEmail).stream()
            .map(this::map)
            .toList();
    }

    public void markAsRead(String alertId, String ownerEmail) {
        Alert alert = alertRepository.findByIdAndRecipientEmail(alertId, ownerEmail)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found"));
        alert.setStatus(AlertStatus.READ);
        alertRepository.save(alert);
    }

    private String buildMessage(BudgetAlertEvent event) {
        return "Project '" + event.getProjectName() + "' in category '" + event.getCategory()
            + "' is forecast to reach " + String.format("%.2f", event.getUsagePercentage())
            + "% of monthly budget. Forecast: EUR " + String.format("%.2f", event.getForecastCost());
    }

    private AlertResponse map(Alert alert) {
        return AlertResponse.builder()
            .id(alert.getId())
            .projectId(alert.getProjectId())
            .projectName(alert.getProjectName())
            .recipientEmail(alert.getRecipientEmail())
            .category(alert.getCategory())
            .forecastCost(alert.getForecastCost())
            .monthlyBudget(alert.getMonthlyBudget())
            .usagePercentage(alert.getUsagePercentage())
            .severity(alert.getSeverity())
            .message(alert.getMessage())
            .status(alert.getStatus())
            .createdAt(alert.getCreatedAt())
            .build();
    }
}
