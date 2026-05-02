{{- define "coverage-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "coverage-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "coverage-service.name" . }}
{{- end }}
{{- end }}

{{- define "coverage-service.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "coverage-service.instance" -}}
{{- .Values.instanceOverride | default (include "coverage-service.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "coverage-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "coverage-service.labels" -}}
helm.sh/chart: {{ include "coverage-service.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "coverage-service.selectorLabels" . }}
{{- end }}

{{- define "coverage-service.selectorLabels" -}}
app: {{ include "coverage-service.name" . }}
app.kubernetes.io/name: {{ include "coverage-service.name" . }}
app.kubernetes.io/instance: {{ include "coverage-service.instance" . }}
{{- end }}
