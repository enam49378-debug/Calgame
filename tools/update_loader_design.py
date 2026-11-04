# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Applying authentic CalFight loading screen with spinning logo and loading text...")

    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace critical CSS in index.html
    css_start = html.find('<!-- Estilos críticos inmediatos para pantalla de carga instantánea -->')
    css_end = html.find('</style>', css_start) + len('</style>') if css_start != -1 else -1

    new_critical_css = """<!-- Estilos críticos inmediatos para pantalla de carga con estilo CalFight -->
<style>
#loading-screen{position:fixed;inset:0;z-index:99999;background:#07080d;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;font-family:'Chakra Petch',system-ui,sans-serif;color:#f3f4f8;overflow:hidden;transition:opacity .5s cubic-bezier(.2,.9,.3,1),transform .5s ease}
#loading-screen.loader-done{opacity:0;transform:scale(1.06);pointer-events:none}
.loader-backdrop{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(215,255,47,.12) 0,rgba(79,195,255,.06) 42%,transparent 75%);pointer-events:none}
.loader-halftone{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1.2px,transparent 1.6px);background-size:12px 12px;pointer-events:none;opacity:.65}
.loader-shell{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;max-width:480px;width:90%;gap:14px}
.loader-logo-zone{position:relative;perspective:900px;display:flex;align-items:center;justify-content:center;padding:12px 0 6px}
.loader-energy-ring{position:absolute;width:min(260px,74vw);height:min(260px,74vw);border:2px dashed rgba(215,255,47,.5);border-radius:50%;box-shadow:0 0 35px rgba(215,255,47,.35),inset 0 0 25px rgba(79,195,255,.25);animation:spinAura 6s linear infinite;pointer-events:none}
.loader-logo-spin{width:min(290px,78vw);height:auto;transform-style:preserve-3d;animation:spinLogo3D 2.8s cubic-bezier(.45,.05,.25,.95) infinite;filter:drop-shadow(0 0 22px rgba(215,255,47,.55))}
.loader-text-block{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}
.loader-title{margin:0;font-family:'Anton',Impact,sans-serif;font-size:clamp(34px,7.5vw,56px);font-style:italic;line-height:1;letter-spacing:.08em;color:#fff;text-shadow:4px 4px 0 #000,0 0 24px rgba(215,255,47,.7);transform:skewX(-10deg);text-transform:uppercase}
.loader-dots i{font-style:normal;color:#d7ff2f;display:inline-block;animation:blinkDot 1.4s infinite}
.loader-dots i:nth-child(2){animation-delay:.2s}
.loader-dots i:nth-child(3){animation-delay:.4s}
.loader-meta-row{display:flex;justify-content:space-between;align-items:center;width:100%;margin-top:2px}
.loader-status-text{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ba1ba}
.loader-pct-badge{background:#d7ff2f;color:#07080d;font-family:'Anton',Impact,sans-serif;font-size:20px;font-style:italic;line-height:1;padding:3px 10px;border-radius:2px;transform:skewX(-14deg);box-shadow:0 0 14px rgba(215,255,47,.6);letter-spacing:.04em}
.loader-bar-shell{width:100%;height:18px;background:rgba(0,0,0,.85);border:2px solid #000;box-shadow:0 0 0 2px rgba(255,255,255,.16),0 8px 24px rgba(0,0,0,.8);transform:skewX(-16deg);position:relative;overflow:hidden;margin-top:4px}
.loader-bar-core{height:100%;background:linear-gradient(90deg,#d7ff2f,#3ee07a,#4fc3ff);transition:width .22s ease-out;box-shadow:0 0 16px rgba(215,255,47,.7);position:relative}
.loader-bar-core::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.35) 10px,rgba(255,255,255,.35) 20px);animation:barStripes 1.2s linear infinite}
.loader-comic-tip{display:flex;align-items:center;gap:12px;background:rgba(12,14,22,.92);border:2px solid #000;border-left:5px solid #d7ff2f;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 10px 25px rgba(0,0,0,.6);transform:skewX(-8deg);padding:9px 15px;width:100%;margin-top:6px}
.tip-flag{background:#d7ff2f;color:#07080d;font-family:'Anton',Impact,sans-serif;font-size:13px;font-style:italic;padding:3px 8px;letter-spacing:.08em;font-weight:900;flex-shrink:0;transform:skewX(-4deg)}
.tip-msg{margin:0;font-family:'Chakra Petch',sans-serif;font-size:12.5px;font-weight:600;color:#bcc4d8;line-height:1.35;text-align:left;transform:skewX(8deg)}
.tip-msg b{color:#fff;text-shadow:1px 1px 0 #000}
@keyframes spinLogo3D{0%{transform:perspective(900px) rotateY(0deg) scale(1);filter:drop-shadow(0 0 18px rgba(215,255,47,.45))}50%{transform:perspective(900px) rotateY(180deg) scale(1.05);filter:drop-shadow(0 0 35px rgba(79,195,255,.8))}100%{transform:perspective(900px) rotateY(360deg) scale(1);filter:drop-shadow(0 0 18px rgba(215,255,47,.45))}}
@keyframes spinAura{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes blinkDot{0%,20%{opacity:0;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}100%{opacity:0;transform:translateY(0)}}
@keyframes barStripes{0%{background-position:0 0}100%{background-position:40px 0}}
</style>"""

    if css_start != -1 and css_end != -1:
        html = html[:css_start] + new_critical_css + html[css_end:]
        print("1. Replaced critical loading screen styles in <head>.")

    # Replace loading screen HTML markup
    markup_start = html.find('<!-- ==================================================================== -->\n<!-- PANTALLA DE CARGA')
    if markup_start == -1:
        markup_start = html.find('<div id="loading-screen"')
    
    markup_end = html.find('<div id="spear-recovery"', markup_start)
    if markup_start != -1 and markup_end != -1:
        new_markup = """<!-- ==================================================================== -->
<!-- PANTALLA DE CARGA ANIME ESTILO CALFIGHT (Logo girando y texto de carga) -->
<!-- ==================================================================== -->
<div id="loading-screen" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="15" aria-label="Cargando CalFight">
  <div class="loader-backdrop"></div>
  <div class="loader-halftone"></div>

  <div class="loader-shell">
    <div class="loader-logo-zone">
      <div class="loader-energy-ring"></div>
      <img src="assets/calfight_logo.png" alt="CalFight Logo" class="loader-logo-spin">
    </div>

    <div class="loader-text-block">
      <h2 class="loader-title">CARGANDO<span class="loader-dots"><i>.</i><i>.</i><i>.</i></span></h2>
      <div class="loader-meta-row">
        <span id="loading-status" class="loader-status-text">Iniciando motor 3D...</span>
        <span id="loading-pct" class="loader-pct-badge">15%</span>
      </div>
      <div class="loader-bar-shell">
        <div id="loading-bar-fill" class="loader-bar-core" style="width: 15%"></div>
      </div>
    </div>

    <div class="loader-comic-tip">
      <span class="tip-flag">CONSEJO</span>
      <p id="loading-tip" class="tip-msg">Presiona <b>SHIFT</b> durante el combate para activar <b>Shift Lock</b> y fijar la cámara en tu rival.</p>
    </div>
  </div>
</div>

"""
        html = html[:markup_start] + new_markup + html[markup_end:]
        print("2. Replaced loading screen markup with authentic spinning logo and loading text.")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html updated successfully!")

    # Sync to CalFight-App
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        print("Synced to CalFight-App bundle!")

if __name__ == '__main__':
    main()
