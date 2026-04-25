# Wrapper para correr el outreach automatico via schtasks.
# Setea el working directory + corre el script con --yes (sin confirmacion interactiva).
# Logs van a _pending/outreach_scheduled.log
#
# Para programarlo a mano (ejemplo manana 9:30am):
#   schtasks /create /tn "PawFriend Outreach" /tr "powershell.exe -ExecutionPolicy Bypass -File C:\Users\psusa\Desktop\pet-harmony-chile-main\scripts\run_outreach_scheduled.ps1" /sc once /sd 04/25/2026 /st 09:30 /f
#
# Para cancelar:
#   schtasks /delete /tn "PawFriend Outreach" /f
#
# Para ver si esta programada:
#   schtasks /query /tn "PawFriend Outreach"

$ErrorActionPreference = "Stop"
$repo = "C:\Users\psusa\Desktop\pet-harmony-chile-main"
$logPath = Join-Path $repo "_pending\outreach_scheduled.log"

Set-Location $repo

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"=== Outreach scheduled run at $timestamp ===" | Out-File -FilePath $logPath -Append -Encoding UTF8

try {
    & python.exe "scripts\send_outreach_refugios.py" --send-all --yes 2>&1 | Tee-Object -FilePath $logPath -Append
    "=== Run finished OK at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File -FilePath $logPath -Append -Encoding UTF8
} catch {
    "=== Run FAILED: $_" | Out-File -FilePath $logPath -Append -Encoding UTF8
    exit 1
}
