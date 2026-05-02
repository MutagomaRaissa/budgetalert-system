{{- define "alert-db.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "alert-db.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "alert-db.name" . }}
{{- end }}
{{- end }}

{{- define "alert-db.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "alert-db.instance" -}}
{{- .Values.instanceOverride | default (include "alert-db.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "alert-db.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "alert-db.labels" -}}
helm.sh/chart: {{ include "alert-db.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "alert-db.selectorLabels" . }}
{{- end }}

{{- define "alert-db.selectorLabels" -}}
app: {{ include "alert-db.name" . }}
app.kubernetes.io/name: {{ include "alert-db.name" . }}
app.kubernetes.io/instance: {{ include "alert-db.instance" . }}
{{- end }}
