# Abre un túnel gratis (localhost.run) hacia el servidor del juego y escribe el link público en publico.txt.
# No necesita instalar nada: usa el "ssh" que ya trae Windows 10/11. Sin cuenta.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$puerto = 52018
$pub = Join-Path $here 'publico.txt'
$out = Join-Path $env:TEMP 'blockstrike_tunel_out.txt'
$err = Join-Path $env:TEMP 'blockstrike_tunel_err.txt'
Remove-Item $out, $err -ErrorAction SilentlyContinue

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Write-Host 'No se encontro ssh. En Windows: Configuracion > Aplicaciones > Funciones opcionales > Cliente OpenSSH.' -ForegroundColor Yellow
  Read-Host 'Enter para salir'; exit 1
}

Write-Host ''
Write-Host "  Abriendo el tunel gratis hacia el puerto $puerto ..." -ForegroundColor Cyan
Write-Host '  (el servidor del juego debe estar abierto: Iniciar_Servidor.bat)' -ForegroundColor DarkGray
$args = @('-o', 'StrictHostKeyChecking=accept-new', '-o', 'ServerAliveInterval=30', '-o', 'ExitOnForwardFailure=yes', '-R', "80:localhost:$puerto", 'nokey@localhost.run')
$p = Start-Process -FilePath 'ssh' -ArgumentList $args -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError $err

$url = $null
for ($i = 0; $i -lt 60 -and -not $url -and -not $p.HasExited; $i++) {
  Start-Sleep -Milliseconds 500
  $txt = ''
  foreach ($f in @($out, $err)) { if (Test-Path $f) { $txt += (Get-Content $f -Raw -ErrorAction SilentlyContinue) } }
  if ($txt -match 'https://[a-z0-9-]+\.lhr\.life') { $url = $Matches[0] }
}

if (-not $url) {
  Write-Host ''
  Write-Host '  No se pudo abrir el tunel. Esto es lo que respondio:' -ForegroundColor Yellow
  foreach ($f in @($out, $err)) { if (Test-Path $f) { Get-Content $f -ErrorAction SilentlyContinue | Select-Object -Last 15 } }
  if (-not $p.HasExited) { $p.Kill() }
  Read-Host 'Enter para salir'; exit 1
}

Set-Content -Path $pub -Value "# Direccion publica generada por Tunel_Gratis.ps1 (cambia cada vez que lo abres)`n$url" -Encoding UTF8
Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Green
Write-Host '   LINK PARA TUS AMIGOS (de cualquier pais):' -ForegroundColor Green
Write-Host "   $url" -ForegroundColor White
Write-Host '  ============================================================' -ForegroundColor Green
Write-Host '   Ya esta guardado en publico.txt: el link de invitacion del juego (pestana amigos) lo usa.'
Write-Host '   Deja esta ventana abierta mientras juegan. Si la cierras se corta el tunel.'
Write-Host ''
try { Set-Clipboard -Value $url; Write-Host '   (el link ya esta copiado: pegalo con Ctrl+V)' -ForegroundColor DarkGray } catch { }
$p.WaitForExit()
Write-Host '  El tunel se cerro.' -ForegroundColor Yellow
Read-Host 'Enter para salir'
