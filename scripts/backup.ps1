#Requires -Version 5.1
<#
  Respaldo de PostgreSQL del despliegue CRM.
  Uso: .\scripts\backup.ps1 [-Container crm-postgres] [-OutDir .\backups]
#>
param(
  [string]$Container = "crm-postgres",
  [string]$OutDir = ".\backups",
  [string]$User = "crm",
  [string]$Db = "crm"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $OutDir "crm-$stamp.sql"

docker exec $Container pg_dump -U $User -d $Db > $out
Write-Output "Respaldo OK: $out"
