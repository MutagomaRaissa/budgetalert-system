# Budgetwatch Umbrella Chart

This chart deploys the complete Budgetwatch platform through local child-chart dependencies.

## Why This Chart Exists

The application is composed of multiple microservices and infrastructure components, so the umbrella chart acts as the main installation entry point and coordinates the whole stack.

## Child Charts

- `api-gateway`
- `project-service`
- `coverage-service`
- `alert-service`
- `dashboard-ui`
- `consul`
- `rabbitmq`
- `project-db`
- `coverage-db`
- `alert-db`
- `networking`

## Dependency Layout

Dependencies are declared in `Chart.yaml` and vendored under `charts/` to keep the umbrella chart self-contained.

## Important Values

- `global.namespace`: target namespace for the platform
- `<chart-name>.enabled`: enable or disable a specific child chart

## Argo CD Readiness

This chart is structured so Argo CD can point directly to `helm/budgetwatch` instead of the raw `iac/` manifests.
