{{- define "consul.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "consul.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "consul.name" . }}
{{- end }}
{{- end }}

{{- define "consul.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "consul.instance" -}}
{{- .Values.instanceOverride | default (include "consul.namespace" .) -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "consul.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "consul.labels" -}}
helm.sh/chart: {{ include "consul.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "consul.selectorLabels" . }}
{{- end }}

{{- define "consul.selectorLabels" -}}
app: {{ include "consul.name" . }}
app.kubernetes.io/name: {{ include "consul.name" . }}
app.kubernetes.io/instance: {{ include "consul.instance" . }}
{{- end }}
