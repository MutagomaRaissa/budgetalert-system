Budget Alert is a cloud-ready budget monitoring platform built with a microservices architecture.

The system separates responsibilities across dedicated services:

Project Service manages users, projects, and resources.
Coverage Service calculates budget coverage and publishes alert events.
Alert Service consumes and stores alerts.
API Gateway centralizes routing.
Dashboard UI provides the user interface.
Consul enables service discovery.
RabbitMQ enables asynchronous communication.
PostgreSQL provides isolated persistence for each service.
Manifests for declarative Kubernetes deployment.
Helm and Argo CD support Kubernetes GitOps deployment.
