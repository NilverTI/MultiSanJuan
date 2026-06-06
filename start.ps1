param(
  [switch]$NoFrontend,
  [switch]$NoBackend
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ts = Get-Date -Format "HH:mm:ss"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MULTI SAN JUAN - Inicio Rapido" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL
Write-Host "[$ts] Verificando PostgreSQL..." -ForegroundColor Yellow
$pg = Get-Service | Where-Object { $_.Name -like "*postgres*" -and $_.Status -eq "Running" }
if (-not $pg) {
  $pgSvc = Get-Service | Where-Object { $_.Name -like "*postgres*" } | Select-Object -First 1
  if ($pgSvc) {
    Start-Service -Name $pgSvc.Name -ErrorAction SilentlyContinue
    Start-Sleep 3
    Write-Host "[$ts] PostgreSQL iniciado" -ForegroundColor Green
  } else {
    Write-Host "[$ts] ERROR: PostgreSQL no encontrado" -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "[$ts] PostgreSQL OK" -ForegroundColor Green
}

# Iniciar proyectos como jobs (persisten en la sesion actual de VS Code)
$jobs = @()

if (-not $NoBackend) {
  Write-Host "[$ts] Iniciando Backend (puerto 3001)..." -ForegroundColor Yellow
  $jb = Start-Job -Name "msj-backend" -ScriptBlock {
    param($d) Set-Location $d; npm run start:dev
  } -ArgumentList "$root\backend"
  $jobs += $jb
  Write-Host "       Backend Job ID: $($jb.Id)" -ForegroundColor Green
}

if (-not $NoFrontend) {
  Write-Host "[$ts] Iniciando Frontend (puerto 3000)..." -ForegroundColor Yellow
  $jf = Start-Job -Name "msj-frontend" -ScriptBlock {
    param($d) Set-Location $d; npm run dev
  } -ArgumentList "$root\frontend"
  $jobs += $jf
  Write-Host "       Frontend Job ID: $($jf.Id)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciados! Los proyectos corren en background." -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Swagger:  http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "COMANDOS:" -ForegroundColor Yellow
Write-Host '  Ver logs:            Receive-Job msj-backend -Keep | Receive-Job msj-frontend -Keep' -ForegroundColor Gray
Write-Host '  Ver estado:          Get-Job msj-* | Format-Table Id, Name, State' -ForegroundColor Gray
Write-Host '  Detener backend:     Stop-Job msj-backend; Remove-Job msj-backend' -ForegroundColor Gray
Write-Host '  Detener frontend:    Stop-Job msj-frontend; Remove-Job msj-frontend' -ForegroundColor Gray
Write-Host '  Detener todo:        Get-Job msj-* | Stop-Job; Get-Job msj-* | Remove-Job' -ForegroundColor Gray
Write-Host ""
Write-Host "Los jobs se detienen al cerrar la terminal de VS Code." -ForegroundColor DarkGray

# Esperar a que compilen y mostrar estado inicial
Start-Sleep 3
$ready = $false
while (-not $ready) {
  $failed = Get-Job msj-* | Where-Object State -eq "Failed"
  if ($failed) { Write-Host "ALGUN JOB FALLO - ejecuta Receive-Job para ver error" -ForegroundColor Red; break }
  $running = Get-Job msj-* | Where-Object State -eq "Running"
  if ($running.Count -eq $jobs.Count) { $ready = $true }
  Start-Sleep 2
}

Write-Host ""
try { $b = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"usernameOrEmail":"admin","password":"admin123"}' -UseBasicParsing -ErrorAction Stop; Write-Host "Backend responde: $($b.StatusCode)" -ForegroundColor Green } catch { Write-Host "Backend aun compilando..." -ForegroundColor DarkYellow }
try { $f = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction Stop; Write-Host "Frontend responde: $($f.StatusCode)" -ForegroundColor Green } catch { Write-Host "Frontend aun compilando..." -ForegroundColor DarkYellow }
