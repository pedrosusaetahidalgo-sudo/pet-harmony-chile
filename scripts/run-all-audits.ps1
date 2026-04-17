# Corre toda la bateria de tests y deja logs con timestamp.
# Uso:   .\scripts\run-all-audits.ps1
# Salida: audits/run-YYYY-MM-DD/*.log + _status.txt

$ErrorActionPreference = "Continue"

$date = Get-Date -Format "yyyy-MM-dd"
$dir  = "audits/run-$date"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$start = Get-Date
"Inicio: $start" | Out-File "$dir/_status.txt"

function Run-Step {
    param([string]$Name, [string]$File, [scriptblock]$Cmd)
    Write-Host ">>> $Name" -ForegroundColor Cyan
    $t0 = Get-Date
    & $Cmd *> "$dir/$File"
    $code = $LASTEXITCODE
    $t1 = Get-Date
    $dur = [int]($t1 - $t0).TotalSeconds
    $status = if ($code -eq 0) { "OK" } else { "FAIL (exit $code)" }
    "$Name -> $status (${dur}s)" | Tee-Object -FilePath "$dir/_status.txt" -Append
}

Run-Step "01 typecheck"  "01-typecheck.log"  { npx tsc -b }
Run-Step "02 lint"       "02-lint.log"       { npm run lint }
Run-Step "03 vitest"     "03-vitest.log"     { npm run test:ci }
Run-Step "04 build"      "04-build.log"      { npm run build }
Run-Step "05 playwright" "05-playwright.log" { npm run test:e2e }

$end = Get-Date
$total = [int]($end - $start).TotalSeconds
"Fin: $end (total ${total}s)" | Out-File "$dir/_status.txt" -Append

Write-Host ""
Write-Host "Listo. Logs en $dir" -ForegroundColor Green
Get-Content "$dir/_status.txt"
