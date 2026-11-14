# -*- coding: utf-8 -*-
import os
import re

def update_index_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Clean up duplicate meta tags inside <body>
    bad_meta = """<meta name="theme-color" content="#10131e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/calfight_icon.png">"""
    
    # We want to replace only the occurrence inside <body> (after <body>)
    body_idx = html.find('<body>')
    if body_idx != -1:
        after_body = html[body_idx:]
        if bad_meta in after_body:
            after_body = after_body.replace(bad_meta, '', 1)
            html = html[:body_idx] + after_body
            print("1. Cleaned duplicate meta tags from inside <body>.")

    # 2. Add inline critical CSS for the loading screen in <head>
    critical_css = """<!-- Estilos críticos inmediatos para pantalla de carga instantánea -->
<style>
#loading-screen{position:fixed;inset:0;z-index:99999;background:#07080d;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;font-family:'Chakra Petch',sans-serif;color:#f3f4f8;transition:opacity .45s cubic-bezier(.2,.9,.3,1),transform .45s ease}
#loading-screen.loader-done{opacity:0;transform:scale(1.05);pointer-events:none}
.loader-backdrop{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(215,255,47,.09) 0,rgba(79,195,255,.05) 38%,transparent 72%);pointer-events:none}
.loader-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;max-width:440px;width:88%;gap:16px}
.loader-logo{width:min(260px,72vw);height:auto;filter:drop-shadow(0 0 24px rgba(215,255,47,.42));animation:pulseLogo 2.2s ease-in-out infinite alternate}
.loader-sub{font-size:10px;letter-spacing:.3em;color:#9ba1ba;font-weight:700;text-transform:uppercase;margin-top:-6px}
.loader-spinner-wrap{position:relative;width:68px;height:68px;display:flex;align-items:center;justify-content:center;margin:2px 0}
.loader-ring{position:absolute;border-radius:50%}
.loader-ring.outer{inset:0;border:3px solid transparent;border-top-color:#d7ff2f;border-right-color:#d7ff2f;animation:spinRight .85s linear infinite}
.loader-ring.inner{inset:8px;border:2.5px solid transparent;border-bottom-color:#4fc3ff;border-left-color:#4fc3ff;animation:spinLeft .65s linear infinite}
.loader-core{font-size:22px;filter:drop-shadow(0 0 10px #fff)}
.loader-progress-box{width:100%;display:flex;flex-direction:column;gap:8px}
.loader-bar-track{height:10px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 2px 4px rgba(0,0,0,.6);position:relative}
.loader-bar-fill{height:100%;background:linear-gradient(90deg,#d7ff2f,#3ee07a,#4fc3ff);border-radius:6px;transition:width .25s ease-out;box-shadow:0 0 14px rgba(215,255,47,.65);position:relative}
.loader-bar-fill::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);animation:barShine 1.3s infinite}
.loader-bar-meta{display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#f3f4f8}
#loading-pct{color:#d7ff2f;font-family:'Anton',Impact,sans-serif;font-size:17px;letter-spacing:.04em}
.loader-tip-card{background:rgba(10,12,20,.78);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:9px 13px;display:flex;align-items:center;gap:10px;width:100%;font-size:12px;color:#9ba1ba;line-height:1.35;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.tip-badge{background:#d7ff2f;color:#07080d;font-family:'Anton',Impact,sans-serif;font-size:11px;padding:2px 7px;border-radius:4px;font-weight:900;letter-spacing:.06em;flex-shrink:0}
@keyframes pulseLogo{from{transform:scale(.98);filter:drop-shadow(0 0 16px rgba(215,255,47,.3))}to{transform:scale(1.02);filter:drop-shadow(0 0 28px rgba(215,255,47,.55))}}
@keyframes spinRight{to{transform:rotate(360deg)}}
@keyframes spinLeft{to{transform:rotate(-360deg)}}
@keyframes barShine{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
</style>"""

    if 'id="loading-screen"' not in html:
        # Insert critical css right before </head>
        head_close = html.find('</head>')
        if head_close != -1:
            html = html[:head_close] + critical_css + '\n' + html[head_close:]
            print("2. Added critical loading screen CSS to <head>.")

        # 3. Add loading screen markup right after <body>
        body_open = html.find('<body>')
        if body_open != -1:
            loader_markup = """
<!-- ==================================================================== -->
<!-- PANTALLA DE CARGA ANIME INICIAL (Web & Desktop)                      -->
<!-- ==================================================================== -->
<div id="loading-screen" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="15" aria-label="Cargando CalFight">
  <div class="loader-backdrop"></div>
  <div class="loader-content">
    <div class="loader-brand">
      <img src="assets/calfight_logo.png" alt="CalFight" class="loader-logo">
      <span class="loader-sub">Peleas Anime · Ciudad de Bloques</span>
    </div>

    <div class="loader-spinner-wrap">
      <div class="loader-ring outer"></div>
      <div class="loader-ring inner"></div>
      <div class="loader-core">⚔️</div>
    </div>

    <div class="loader-progress-box">
      <div class="loader-bar-track">
        <div id="loading-bar-fill" class="loader-bar-fill" style="width: 15%"></div>
      </div>
      <div class="loader-bar-meta">
        <span id="loading-status">Iniciando motor 3D...</span>
        <span id="loading-pct">15%</span>
      </div>
    </div>

    <div class="loader-tip-card">
      <span class="tip-badge">CONSEJO</span>
      <p id="loading-tip" style="margin:0">Presiona <b>SHIFT</b> durante el combate para activar <b>Shift Lock</b> y fijar la cámara en tu rival.</p>
    </div>
  </div>
</div>
"""
            insert_pos = body_open + len('<body>')
            html = html[:insert_pos] + loader_markup + html[insert_pos:]
            print("3. Inserted loading screen HTML markup at start of <body>.")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html successfully updated!")

update_index_html()
