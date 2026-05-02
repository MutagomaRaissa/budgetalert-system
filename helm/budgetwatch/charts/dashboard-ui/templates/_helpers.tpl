{{- define "dashboard-ui.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "dashboard-ui.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "dashboard-ui.name" . }}
{{- end }}
{{- end }}

{{- define "dashboard-ui.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "dashboard-ui.instance" -}}
{{- .Values.instanceOverride | default (include "dashboard-ui.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "dashboard-ui.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "dashboard-ui.labels" -}}
helm.sh/chart: {{ include "dashboard-ui.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "dashboard-ui.selectorLabels" . }}
{{- end }}

{{- define "dashboard-ui.selectorLabels" -}}
app: {{ include "dashboard-ui.name" . }}
app.kubernetes.io/name: {{ include "dashboard-ui.name" . }}
app.kubernetes.io/instance: {{ include "dashboard-ui.instance" . }}
{{- end }}
