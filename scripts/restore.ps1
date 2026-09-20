#Requires -Version 5.1
<#
  Restaura PostgreSQL desde un respaldo .sql (CUIDADO: sobrescribe datos).
  Uso: .\scripts\restore.ps1 -File .\backups\crm-20260919-120000.sql
#>
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$Container = "crm-postgres",
  [string]$User = "crm",
  [string]$Db = "crm"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $File)) { throw "No existe: $File" }
$confirm = Read-Host "Sobrescribirá la BD '$Db'. Escribe SI para continuar"
if ($confirm -ne "SI") { Write-Output "Cancelado."; exit 0 }
Get-Content -Raw $File | docker exec -i $Container psql -U $User -d $Db -v ON_ERROR_STOP=1 | Select-Object -Last 5
Write-Output "Restauración OK desde $File"
