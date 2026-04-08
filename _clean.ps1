$ErrorActionPreference = 'SilentlyContinue'
function Section($t){ Write-Host "`n=== $t ===" -ForegroundColor Cyan }

Section "1. Cerrando Docker Desktop"
Get-Process 'Docker Desktop','com.docker.backend','com.docker.build','com.docker.dev-envs','com.docker.proxy','vpnkit','wsl' -ErrorAction SilentlyContinue | ForEach-Object {
    try { $_.Kill(); "  killed $($_.Name)" } catch { "  skip $($_.Name)" }
}
wsl --shutdown 2>$null
Write-Host "  Docker/WSL detenido"

Section "2. Quitando entradas de arranque (HKCU Run)"
$runKey = 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'
$toRemoveHKCU = @('Ollama','Steam','electron.app.OP.GG','Synapse3','com.squirrel.slack.slack','RiotClient','EpicGamesLauncher','Teams')
foreach ($n in $toRemoveHKCU) {
    if (Get-ItemProperty -Path $runKey -Name $n -ErrorAction SilentlyContinue) {
        Remove-ItemProperty -Path $runKey -Name $n -ErrorAction SilentlyContinue
        Write-Host "  removido: $n"
    } else {
        Write-Host "  (no estaba): $n"
    }
}

Section "3. Quitando Riot Vanguard (HKLM - requiere admin)"
try {
    Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'Riot Vanguard' -ErrorAction Stop
    Write-Host "  removido"
} catch {
    Write-Host "  NO se pudo (necesita admin) - lo hago manual abajo" -ForegroundColor Yellow
}

Section "4. Quitando accesos directos de Startup folder"
$startupPaths = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
)
foreach ($sp in $startupPaths) {
    Get-ChildItem $sp -Filter '*Jagex*' -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "  removido: $($_.FullName)"
    }
}

Section "5. Limpiando cachés"
$targets = @(
    "$env:TEMP",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:APPDATA\Code\Cache",
    "$env:APPDATA\Code\CachedData",
    "C:\Windows\Temp"
)
$totalFreed = 0
foreach ($t in $targets) {
    if (-not (Test-Path $t)) { continue }
    $before = (Get-ChildItem $t -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    Get-ChildItem $t -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    $after = (Get-ChildItem $t -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    $freed = ($before - $after)/1MB
    $totalFreed += $freed
    '{0,8:N0} MB liberados  {1}' -f $freed, $t
}

Section "6. Windows Update cache (parando servicio)"
Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
$wu = "C:\Windows\SoftwareDistribution\Download"
if (Test-Path $wu) {
    $b = (Get-ChildItem $wu -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    Get-ChildItem $wu -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    $a = (Get-ChildItem $wu -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    $f = ($b-$a)/1MB
    $totalFreed += $f
    '{0,8:N0} MB liberados  {1}' -f $f,$wu
}
Start-Service wuauserv -ErrorAction SilentlyContinue

Section "RESULTADO"
'{0:N0} MB liberados en total' -f $totalFreed
Get-Volume C | Select-Object DriveLetter,
    @{n='FreeGB';e={[math]::Round($_.SizeRemaining/1GB,1)}} | Format-Table -AutoSize
Get-CimInstance Win32_OperatingSystem | Select-Object `
    @{n='FreeRAM_GB';e={[math]::Round($_.FreePhysicalMemory/1MB,1)}} | Format-Table -AutoSize
