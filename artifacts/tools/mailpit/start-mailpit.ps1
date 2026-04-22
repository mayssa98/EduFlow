$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $root 'mailpit.exe'
$log = Join-Path $root 'mailpit.log'
$err = Join-Path $root 'mailpit.err.log'

if (-not (Test-Path $exe)) {
    throw "mailpit.exe not found in $root"
}

$existing = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq 'mailpit.exe' -and $_.ExecutablePath -eq $exe }

if ($existing) {
    $existing | Select-Object ProcessId, Name, ExecutablePath
    exit 0
}

Start-Process -FilePath $exe `
    -WorkingDirectory $root `
    -RedirectStandardOutput $log `
    -RedirectStandardError $err `
    -PassThru |
    Select-Object Id, ProcessName
