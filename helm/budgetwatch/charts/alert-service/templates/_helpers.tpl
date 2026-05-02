{{- define "alert-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "alert-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "alert-service.name" . }}
{{- end }}
{{- end }}

{{- define "alert-service.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "alert-service.instance" -}}
{{- .Values.instanceOverride | default (include "alert-service.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "alert-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "alert-service.labels" -}}
helm.sh/chart: {{ include "alert-service.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "alert-service.selectorLabels" . }}
{{- end }}

{{- define "alert-service.selectorLabels" -}}
app: {{ include "alert-service.name" . }}
app.kubernetes.io/name: {{ include "alert-service.name" . }}
app.kubernetes.io/instance: {{ include "alert-service.instance" . }}
{{- end }}
