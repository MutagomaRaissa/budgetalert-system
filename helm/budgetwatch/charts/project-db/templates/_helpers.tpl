{{- define "project-db.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "project-db.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "project-db.name" . }}
{{- end }}
{{- end }}

{{- define "project-db.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "project-db.instance" -}}
{{- .Values.instanceOverride | default (include "project-db.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "project-db.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "project-db.labels" -}}
helm.sh/chart: {{ include "project-db.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "project-db.selectorLabels" . }}
{{- end }}

{{- define "project-db.selectorLabels" -}}
app: {{ include "project-db.name" . }}
app.kubernetes.io/name: {{ include "project-db.name" . }}
app.kubernetes.io/instance: {{ include "project-db.instance" . }}
{{- end }}
