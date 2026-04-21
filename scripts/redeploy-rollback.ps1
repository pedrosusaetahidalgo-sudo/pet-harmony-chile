# Redeploy de las 28 edge fns afectadas por el rollback 08fe4300.
# Aplica la vuelta de verify_jwt=true → false en el gateway de Supabase.
#
# Uso (desde la raiz del repo):
#   .\scripts\redeploy-rollback.ps1
#
# Requiere sesion activa: npx supabase login
$fns = @(
  'flow-create-subscription',
  'flow-create-donation',
  'pet-assistant',
  'breed-tips',
  'medical-suggestions',
  'bereavement-assistant',
  'symptom-triage',
  'nutrition-coach',
  'wound-vision',
  'consultation-prep',
  'ocr-vaccination-card',
  'process-consultation-transcript',
  'moderate-service-promotion',
  'generate-medical-summary',
  'generate-medical-zip',
  'generate-vet-patient-summary',
  'generate-shelter-report-pdf',
  'create-patient',
  'send-pet-invitation',
  'bulk-import-pets',
  'google-calendar-oauth-init',
  'google-calendar-sync',
  'google-calendar-disconnect',
  'feedback-admin',
  'send-lead-outreach',
  'verify-vet-document',
  'verify-service-provider',
  'generate-shelters'
)

$ok = @()
$fail = @()

foreach ($fn in $fns) {
  Write-Host "`n=== Deploying $fn ===" -ForegroundColor Cyan
  npx supabase functions deploy $fn
  if ($LASTEXITCODE -eq 0) {
    $ok += $fn
  } else {
    $fail += $fn
    Write-Host "  ! Fallo $fn (exit $LASTEXITCODE)" -ForegroundColor Red
  }
}

Write-Host "`n================================" -ForegroundColor Green
Write-Host "OK: $($ok.Count) / $($fns.Count)" -ForegroundColor Green
if ($fail.Count -gt 0) {
  Write-Host "Fallidas: $($fail -join ', ')" -ForegroundColor Red
  exit 1
}
Write-Host "Todas las fns redeployadas. Smoke test en prod." -ForegroundColor Green
