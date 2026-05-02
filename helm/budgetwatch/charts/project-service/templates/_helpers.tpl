{{- define "project-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "project-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "project-service.name" . }}
{{- end }}
{{- end }}

{{- define "project-service.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "project-service.instance" -}}
{{- .Values.instanceOverride | default (include "project-service.namespace" .) -}}
{{- end }}

{{- define "project-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "project-service.labels" -}}
helm.sh/chart: {{ include "project-service.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "project-service.selectorLabels" . }}
{{- end }}

{{- define "project-service.selectorLabels" -}}
app: {{ include "project-service.name" . }}
app.kubernetes.io/name: {{ include "project-service.name" . }}
app.kubernetes.io/instance: {{ include "project-service.instance" . }}
{{- end }}
