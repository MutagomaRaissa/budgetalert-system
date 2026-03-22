param(
  [Parameter(Mandatory = $true)]
  [string]$BackupDir
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $root "docker-compose.yml"
$envFile = Join-Path $root ".env.prod"

$projectSql = Join-Path $BackupDir "project_db.sql"
$coverageSql = Join-Path $BackupDir "coverage_db.sql"
$alertSql = Join-Path $BackupDir "alert_db.sql"

Get-Content $projectSql | docker compose -f $composeFile --env-file $envFile exec -T project-db psql -U project_user -d project_db
Get-Content $coverageSql | docker compose -f $composeFile --env-file $envFile exec -T coverage-db psql -U coverage_user -d coverage_db
Get-Content $alertSql | docker compose -f $composeFile --env-file $envFile exec -T alert-db psql -U alert_user -d alert_db

Write-Host "Restore completed from $BackupDir"
