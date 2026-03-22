package com.budgetalert.alertservice.listener;

import com.budgetalert.alertservice.event.BudgetAlertEvent;
import com.budgetalert.alertservice.service.AlertService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BudgetAlertListener {
    private final AlertService alertService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "budget.alert.queue")
    public void onBudgetAlert(String payload) {
        try {
            BudgetAlertEvent event = objectMapper.readValue(payload, BudgetAlertEvent.class);
            log.info("Received budget alert event for project {}", event.getProjectName());
            alertService.createFromEvent(event);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to parse budget alert payload", exception);
        }
    }
}
