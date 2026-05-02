# Budgetwatch Helm Charts

This directory contains the Helm packaging for the Budgetwatch microservices platform.

## Structure

- `budgetwatch/`: umbrella chart for the whole platform
- `budgetwatch/charts/`: child charts for each deployable component

## Entry Point

The umbrella chart in `helm/budgetwatch` is the single entry point for deploying the full stack.

## Included Components

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

## Notes

- The umbrella chart declares explicit dependencies in `Chart.yaml`.
- The dependency charts are vendored inside `budgetwatch/charts/`, so Helm can resolve them locally without fetching remote chart repositories.
