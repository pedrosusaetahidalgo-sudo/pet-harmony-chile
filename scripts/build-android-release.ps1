#!/usr/bin/env pwsh
# Build Android release bundle (.aab) for Play Store upload
# Prerequisites:
#   1. keystore.properties configured in android/
#   2. google-services.json in android/app/
#   3. All env vars set in .env

param(
    [switch]$Bundle,  # Default: generates AAB (App Bundle for Play Store)
    [switch]$Apk      # Pass -Apk to generate APK instead
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }
Set-Location $ProjectRoot

Write-Host "=== Paw Friend Android Release Build ===" -ForegroundColor Cyan

# Step 1: Verify prerequisites
Write-Host "`n[1/5] Verificando prerequisitos..." -ForegroundColor Yellow

if (-not (Test-Path "android/keystore.properties")) {
    Write-Host "ERROR: android/keystore.properties no existe." -ForegroundColor Red
    Write-Host "Copia android/keystore.properties.example y llena los valores." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "android/app/google-services.json")) {
    Write-Host "ADVERTENCIA: android/app/google-services.json no existe." -ForegroundColor Yellow
    Write-Host "Firebase Analytics no funcionara en esta build." -ForegroundColor Yellow
}

# Step 2: Build web assets
Write-Host "`n[2/5] Construyendo assets web (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm run build fallo." -ForegroundColor Red; exit 1 }

# Step 3: Sync Capacitor
Write-Host "`n[3/5] Sincronizando Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: cap sync fallo." -ForegroundColor Red; exit 1 }

# Step 4: Build
Write-Host "`n[4/5] Compilando release..." -ForegroundColor Yellow
Set-Location android

if ($Apk) {
    ./gradlew assembleRelease
    $outputPath = "app/build/outputs/apk/release/"
    $outputType = "APK"
} else {
    ./gradlew bundleRelease
    $outputPath = "app/build/outputs/bundle/release/"
    $outputType = "AAB (App Bundle)"
}

if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Gradle build fallo." -ForegroundColor Red; exit 1 }

Set-Location $ProjectRoot

# Step 5: Done
Write-Host "`n[5/5] Build completada!" -ForegroundColor Green
Write-Host "Tipo: $outputType" -ForegroundColor Cyan
Write-Host "Ubicacion: android/$outputPath" -ForegroundColor Cyan
Write-Host "`nSube el archivo a Google Play Console > Production > Create new release" -ForegroundColor Yellow
