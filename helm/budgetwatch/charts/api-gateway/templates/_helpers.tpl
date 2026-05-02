{{- define "api-gateway.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "api-gateway.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- include "api-gateway.name" . }}
{{- end }}
{{- end }}

{{- define "api-gateway.namespace" -}}
{{- .Values.namespaceOverride | default .Values.global.namespace | default .Release.Namespace -}}
{{- end }}

{{- define "api-gateway.instance" -}}
{{- .Values.instanceOverride | default (include "api-gateway.namespace" .) -}}
{{- end }}

{{- define "api-gateway.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "api-gateway.labels" -}}
helm.sh/chart: {{ include "api-gateway.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Values.partOf | quote }}
{{ include "api-gateway.selectorLabels" . }}
{{- end }}

{{- define "api-gateway.selectorLabels" -}}
app: {{ include "api-gateway.name" . }}
app.kubernetes.io/name: {{ include "api-gateway.name" . }}
app.kubernetes.io/instance: {{ include "api-gateway.instance" . }}
{{- end }}
