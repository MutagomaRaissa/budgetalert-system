package com.budgetalert.coverageservice.config;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.*;
@Configuration
public class RabbitMqConfig { public static final String BUDGET_ALERT_QUEUE="budget.alert.queue"; @Bean public Queue budgetAlertQueue(){ return new Queue(BUDGET_ALERT_QUEUE,true);} }