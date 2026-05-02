{{- define "networking.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "networking.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "networking.name" . }}
{{- end }}
{{- end }}

{{- define "networking.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "networking.instance" -}}
{{- .Values.instanceOverride | default (include "networking.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "networking.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "networking.labels" -}}
helm.sh/chart: {{ include "networking.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "networking.selectorLabels" . }}
{{- end }}

{{- define "networking.selectorLabels" -}}
app.kubernetes.io/name: {{ include "networking.name" . }}
app.kubernetes.io/instance: {{ include "networking.instance" . }}
{{- end }}
