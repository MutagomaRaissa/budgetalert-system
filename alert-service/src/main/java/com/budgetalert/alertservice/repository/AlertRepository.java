package com.budgetalert.alertservice.repository;

import com.budgetalert.alertservice.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, String> {
    List<Alert> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);

    Optional<Alert> findByIdAndRecipientEmail(String id, String recipientEmail);
}
