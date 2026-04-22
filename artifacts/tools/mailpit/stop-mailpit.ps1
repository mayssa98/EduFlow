$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $root 'mailpit.exe'

$existing = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq 'mailpit.exe' -and $_.ExecutablePath -eq $exe }

if (-not $existing) {
    Write-Output 'Mailpit is not running.'
    exit 0
}

$existing | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
$existing | Select-Object ProcessId, Name
