# Túnel gratis con Cloudflare (más estable que localhost.run). Sin cuenta.
# Necesita el programa cloudflared.exe: descárgalo UNA vez de
#   https://github.com/cloudflare/cloudflared/releases/latest   (archivo: cloudflared-windows-amd64.exe)
# y déjalo en esta carpeta con el nombre  cloudflared.exe  (o en una subcarpeta llamada cloudflared).
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$puerto = 52018
$pub = Join-Path $here 'publico.txt'
$exe = $null
foreach ($c in @((Join-Path $here 'cloudflared.exe'), (Join-Path $here 'cloudflared\cloudflared.exe'))) { if (Test-Path $c) { $exe = $c; break } }
if (-not $exe) {
  Write-Host ''
  Write-Host '  No se encontro cloudflared.exe.' -ForegroundColor Yellow
  Write-Host '  Descargalo de https://github.com/cloudflare/cloudflared/releases/latest'
  Write-Host '  (cloudflared-windows-amd64.exe), renombralo a cloudflared.exe y ponlo en esta carpeta.'
  Read-Host 'Enter para salir'; exit 1
}
$out = Join-Path $env:TEMP 'blockstrike_cf_out.txt'
$err = Join-Path $env:TEMP 'blockstrike_cf_err.txt'
$intento = 0
while ($true) {
  $intento++
  Remove-Item $out, $err -ErrorAction SilentlyContinue
  Write-Host ''
  Write-Host "  Conectando con Cloudflare... (intento $intento)" -ForegroundColor Cyan
  $p = Start-Process -FilePath $exe -ArgumentList @('tunnel', '--no-autoupdate', '--url', "http://localhost:$puerto") -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
  $url = $null
  for ($i = 0; $i -lt 80 -and -not $url -and -not $p.HasExited; $i++) {
    Start-Sleep -Milliseconds 500
    $txt = ''
    foreach ($f in @($out, $err)) { if (Test-Path $f) { $txt += (Get-Content $f -Raw -ErrorAction SilentlyContinue) } }
    if ($txt -match 'https://[a-z0-9-]+\.trycloudflare\.com') { $url = $Matches[0] }
  }
  if ($url) {
    Set-Content -Path $pub -Value "# Direccion publica generada por Tunel_Cloudflare.ps1 (cambia cada vez que se reconecta)`n$url" -Encoding UTF8
    Write-Host ''
    Write-Host '  ============================================================' -ForegroundColor Green
    Write-Host '   LINK PARA TUS AMIGOS (de cualquier pais):' -ForegroundColor Green
    Write-Host "   $url" -ForegroundColor White
    Write-Host '  ============================================================' -ForegroundColor Green
    Write-Host '   Guardado en publico.txt. Deja esta ventana abierta mientras juegan.'
    try { Set-Clipboard -Value $url; Write-Host '   (ya esta copiado: pegalo con Ctrl+V)' -ForegroundColor DarkGray } catch { }
    $p.WaitForExit()
    Write-Host '  *** El tunel se corto. Reconectando... ***' -ForegroundColor Yellow
  } else {
    if (-not $p.HasExited) { try { $p.Kill() } catch { } }
    Write-Host '  No se pudo abrir el tunel. Respuesta:' -ForegroundColor Yellow
  }
  foreach ($f in @($out, $err)) { if (Test-Path $f) { Get-Content $f -ErrorAction SilentlyContinue | Select-Object -Last 8 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray } } }
  Start-Sleep -Seconds 4
}
