package com.budgetalert.alertservice.controller;

import com.budgetalert.alertservice.dto.AlertResponse;
import com.budgetalert.alertservice.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {
    private final AlertService alertService;

    @GetMapping
    public List<AlertResponse> getAlerts(Authentication authentication) {
        return alertService.getAlerts(authentication.getName());
    }

    @PatchMapping("/{alertId}/read")
    public void markAsRead(Authentication authentication, @PathVariable String alertId) {
        alertService.markAsRead(alertId, authentication.getName());
    }
}
