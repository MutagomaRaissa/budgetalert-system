$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $root "docker-compose.yml"
$envFile = Join-Path $root ".env.prod"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $root "backups\$timestamp"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$projectOut = Join-Path $backupDir "project_db.sql"
$coverageOut = Join-Path $backupDir "coverage_db.sql"
$alertOut = Join-Path $backupDir "alert_db.sql"

docker compose -f $composeFile --env-file $envFile exec -T project-db pg_dump -U project_user -d project_db | Out-File -FilePath $projectOut -Encoding utf8
docker compose -f $composeFile --env-file $envFile exec -T coverage-db pg_dump -U coverage_user -d coverage_db | Out-File -FilePath $coverageOut -Encoding utf8
docker compose -f $composeFile --env-file $envFile exec -T alert-db pg_dump -U alert_user -d alert_db | Out-File -FilePath $alertOut -Encoding utf8

Write-Host "Backups written to $backupDir"
