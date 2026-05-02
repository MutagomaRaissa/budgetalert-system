{{- define "coverage-db.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "coverage-db.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "coverage-db.name" . }}
{{- end }}
{{- end }}

{{- define "coverage-db.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "coverage-db.instance" -}}
{{- .Values.instanceOverride | default (include "coverage-db.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "coverage-db.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "coverage-db.labels" -}}
helm.sh/chart: {{ include "coverage-db.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "coverage-db.selectorLabels" . }}
{{- end }}

{{- define "coverage-db.selectorLabels" -}}
app: {{ include "coverage-db.name" . }}
app.kubernetes.io/name: {{ include "coverage-db.name" . }}
app.kubernetes.io/instance: {{ include "coverage-db.instance" . }}
{{- end }}
