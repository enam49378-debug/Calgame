# Abre un túnel gratis (localhost.run) hacia el servidor del juego y escribe el link público en publico.txt.
# No necesita instalar nada: usa el "ssh" que ya trae Windows 10/11. Sin cuenta.
# Si el túnel se corta, se reconecta solo (el link NUEVO aparece en esta ventana y en publico.txt).
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$puerto = 52018
$pub = Join-Path $here 'publico.txt'
$out = Join-Path $env:TEMP 'blockstrike_tunel_out.txt'
$err = Join-Path $env:TEMP 'blockstrike_tunel_err.txt'

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Write-Host 'No se encontro ssh. En Windows: Configuracion > Aplicaciones > Funciones opcionales > Cliente OpenSSH.' -ForegroundColor Yellow
  Read-Host 'Enter para salir'; exit 1
}
Write-Host ''
Write-Host "  Tunel gratis (localhost.run) hacia el puerto $puerto" -ForegroundColor Cyan
Write-Host '  (el servidor del juego debe estar abierto)' -ForegroundColor DarkGray

$intento = 0
while ($true) {
  $intento++
  Remove-Item $out, $err -ErrorAction SilentlyContinue
  Write-Host ''
  Write-Host "  Conectando... (intento $intento)" -ForegroundColor Cyan
  $args = @('-o', 'StrictHostKeyChecking=accept-new', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', '-o', 'ExitOnForwardFailure=yes', '-R', "80:localhost:$puerto", 'nokey@localhost.run')
  $p = Start-Process -FilePath 'ssh' -ArgumentList $args -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError $err

  $url = $null
  for ($i = 0; $i -lt 60 -and -not $url -and -not $p.HasExited; $i++) {
    Start-Sleep -Milliseconds 500
    $txt = ''
    foreach ($f in @($out, $err)) { if (Test-Path $f) { $txt += (Get-Content $f -Raw -ErrorAction SilentlyContinue) } }
    if ($txt -match 'https://[a-z0-9-]+\.lhr\.life') { $url = $Matches[0] }
  }

  if ($url) {
    Set-Content -Path $pub -Value "# Direccion publica generada por Tunel_Gratis.ps1 (cambia cada vez que se reconecta)`n$url" -Encoding UTF8
    Write-Host ''
    Write-Host '  ============================================================' -ForegroundColor Green
    Write-Host '   LINK PARA TUS AMIGOS (de cualquier pais):' -ForegroundColor Green
    Write-Host "   $url" -ForegroundColor White
    Write-Host '  ============================================================' -ForegroundColor Green
    Write-Host '   Guardado en publico.txt (el link de invitacion del juego lo usa).'
    Write-Host '   Deja esta ventana abierta. Si el link se corta, aqui aparece uno nuevo.'
    try { Set-Clipboard -Value $url; Write-Host '   (ya esta copiado: pegalo con Ctrl+V)' -ForegroundColor DarkGray } catch { }
    $p.WaitForExit()
    Write-Host ''
    Write-Host '  *** El tunel se corto. Ese link ya NO funciona. Reconectando... ***' -ForegroundColor Yellow
  } else {
    if (-not $p.HasExited) { try { $p.Kill() } catch { } }
    Write-Host '  No se pudo abrir el tunel. Respuesta:' -ForegroundColor Yellow
  }
  foreach ($f in @($out, $err)) { if (Test-Path $f) { Get-Content $f -ErrorAction SilentlyContinue | Select-Object -Last 8 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray } } }
  Start-Sleep -Seconds 4
}
