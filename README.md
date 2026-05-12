 Budget Alert System – Kubernetes, Helm & GitOps Infrastructure

The `iac` branch of the Budget Alert System repository contains the complete Kubernetes deployment architecture for the platform, including:

- Raw Kubernetes manifests
- Helm umbrella chart configuration
- Argo CD GitOps deployment setup
- Infrastructure organization by microservice

Platform Overview

Budget Alert System is a microservices-based platform designed for budget monitoring, project tracking, and alert management.

The platform consists of several services:

<img width="411" height="187" alt="image" src="https://github.com/user-attachments/assets/6006f586-2079-4589-b42d-35d8a5f8089f" />


 Repository Structure


<img width="496" height="376" alt="image" src="https://github.com/user-attachments/assets/77396a5a-68a4-47a9-8694-9ad69b1681b7" />



Infrastructure as Code (iac/)

The "iac/" directory contains all raw Kubernetes manifests organized by service.

Each microservice has its own directory containing deployment resources such as:

Deployments, 
Services, 
ConfigMaps, 
Secrets, 
Ingress definitions, 
Persistent Volume configurations

Example structure:

<img width="166" height="117" alt="image" src="https://github.com/user-attachments/assets/63e43658-d993-41c7-8b20-0004c0acf1f0" />


Deploy Using Raw Kubernetes Manifests

To deploy all manifests directly:

     kubectl apply -f iac/

To deploy a specific service:

    kubectl apply -f iac/project-service/
    

Helm Deployment Architecture


The "helm/budgetwatch" directory contains the umbrella Helm chart used to deploy the entire platform as a single Kubernetes application.

The Helm architecture centralizes:

Service deployment orchestration, 
Shared configuration, 
Dependency management, 
Environment-specific customization, 
Kubernetes templating

Helm Structure


<img width="166" height="130" alt="image" src="https://github.com/user-attachments/assets/ce3bba25-772e-4b9c-989c-8f5989509826" />

Chart.yaml


The Chart.yaml file defines the metadata of the umbrella chart and declares dependencies between services.

The umbrella chart manages all platform services through dependencies.

<img width="232" height="147" alt="image" src="https://github.com/user-attachments/assets/074d9056-2ab9-49b2-860f-f1b5171ea959" />

The umbrella chart is the single entry point for deploying the entire platform.


charts/ Directory


The charts/ folder contains the child charts for each microservice.

Example:

<img width="182" height="132" alt="image" src="https://github.com/user-attachments/assets/69325745-94b2-445e-b1eb-0ee9c04dc70b" />


Each child chart is independently deployable and encapsulates:

Deployments, 
Services, 
Ingresses, 
ConfigMaps, 
Secrets, 
Autoscaling configuration, 
Child Chart Structure

Each service chart generally follows the standard Helm structure:

<img width="282" height="197" alt="image" src="https://github.com/user-attachments/assets/5a138406-1952-4ac4-97de-05282e245286" />

    
values.yaml

The values.yaml file centralizes deployment configuration for all services.


Instead of hardcoding values in templates, Helm dynamically injects them during rendering.



Helm Templates (templates/)



The templates/ folder contains Kubernetes resource templates processed by Helm.


Helm replaces template variables with values from values.yaml during deployment.


Helm Rendering Flow


<img width="212" height="180" alt="image" src="https://github.com/user-attachments/assets/48c10887-92b3-44ca-b6ce-979daf232216" />



Shared Global Configuration


The umbrella chart  defines global shared values:

global:

       namespace: budgetwatch
       imagePullPolicy: Always

Child charts inherit these values:

    imagePullPolicy: {{ .Values.global.imagePullPolicy }}

This ensures consistent configuration across all services.

Deploy with Helm


Install the platform:

    helm install budgetwatch helm/budgetwatch

Upgrade deployment:

    helm upgrade budgetwatch helm/budgetwatch

Render templates without deploying:

    helm template budgetwatch helm/budgetwatch

Dry-run deployment:

    helm install budgetwatch helm/budgetwatch --dry-run --debug
  
  
  Argo CD GitOps Deployment

   GitOps deployment is managed through Argo CD using:

     applicationset.yaml

The ApplicationSet automatically deploys applications from this repository and continuously reconciles the Kubernetes cluster state with Git.

Argo CD Deployment Modes
Deploy Using Helm , uses the Helm chart path:
                                                        
                    path: helm/budgetwatch

Argo CD will:

Pull the repository, 
Detect the Helm chart, 
Render templates, 
Deploy generated manifests, 
Continuously synchronize the cluster


Deploy Using Raw IaC Manifests

Use the manifests path:

     path: iac/*

Argo CD can also deploy the Kubernetes manifests  folder without Helm templating directly from the "iac/" by changing path in the argo application set.







