# Budget Alert Platform

Monorepo containing:
- api-gateway
- project-service
- coverage-service
- alert-service
- dashboard-ui
- docker-compose.yml

## Architecture

Project Service owns users, projects, resources.
Coverage Service computes forecasted cost and publishes budget alert events to RabbitMQ.
Alert Service consumes alert events, stores them, and sends email through MailHog.
API Gateway fronts all backend services and proxies Swagger docs.
