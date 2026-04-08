Write-Host "=== DISCO C: ===" -ForegroundColor Cyan
Get-Volume C | Select-Object DriveLetter,FileSystemLabel,
    @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}},
    @{n='FreeGB';e={[math]::Round($_.SizeRemaining/1GB,1)}} | Format-Table -AutoSize

Write-Host "`n=== RAM ===" -ForegroundColor Cyan
Get-CimInstance Win32_OperatingSystem | Select-Object `
    @{n='TotalRAM_GB';e={[math]::Round($_.TotalVisibleMemorySize/1MB,1)}},
    @{n='FreeRAM_GB';e={[math]::Round($_.FreePhysicalMemory/1MB,1)}} | Format-Table -AutoSize

Write-Host "`n=== TOP 15 PROCESOS POR RAM ===" -ForegroundColor Cyan
Get-Process | Sort-Object WS -Descending | Select-Object -First 15 `
    Name,@{n='RAM_MB';e={[math]::Round($_.WS/1MB,0)}},Id | Format-Table -AutoSize

Write-Host "`n=== TAMANO CACHES/TEMP ===" -ForegroundColor Cyan
$paths = @(
    "$env:TEMP",
    "C:\Windows\Temp",
    "$env:LOCALAPPDATA\Microsoft\Windows\INetCache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "C:\Windows\SoftwareDistribution\Download",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:APPDATA\Code\Cache",
    "$env:APPDATA\Code\CachedData",
    "$env:APPDATA\Code\Code Cache"
)
foreach ($p in $paths) {
    if (Test-Path $p) {
        $s = (Get-ChildItem $p -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        '{0,8:N0} MB  {1}' -f ($s/1MB), $p
    } else {
        '   (n/a)   {0}' -f $p
    }
}

Write-Host "`n=== STARTUP ===" -ForegroundColor Cyan
Get-CimInstance Win32_StartupCommand | Select-Object Name,Location | Format-Table -AutoSize
