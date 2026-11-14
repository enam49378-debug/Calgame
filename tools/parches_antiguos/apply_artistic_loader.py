# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Applying Super Artistic Anime Loading Screen and Transition to Menu...")

    # =========================================================================
    # 1. UPDATE index.html
    # =========================================================================
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    css_start = html.find('<!-- Estilos críticos inmediatos')
    if css_start == -1:
        css_start = html.find('<style>\n#loading-screen')
    css_end = html.find('</style>', css_start) + len('</style>') if css_start != -1 else -1

    new_critical_css = """<!-- Estilos críticos inmediatos para pantalla de carga super artística anime -->
<style>
#loading-screen{
  position:fixed;inset:0;z-index:99999;
  background:radial-gradient(ellipse at 50% 25%, #261f46 0%, #16122c 50%, #0a0817 100%);
  display:flex;align-items:center;justify-content:center;
  user-select:none;-webkit-user-select:none;
  font-family:'Chakra Petch',system-ui,sans-serif;color:#fff6ea;
  overflow:hidden;
  transition:opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1),filter .75s ease;
}
#loading-screen.loader-done{
  opacity:0;
  transform:scale(1.12);
  filter:blur(8px);
  pointer-events:none;
}
#loading-flash{
  position:fixed;inset:0;z-index:100000;
  background:#fffdfa;opacity:0;pointer-events:none;
  transition:opacity .5s ease;
}
.art-bg-sky{
  position:absolute;inset:0;
  background:radial-gradient(circle at 50% 12%,rgba(255,215,165,.18) 0%,rgba(179,136,255,.09) 36%,transparent 72%);
  pointer-events:none;
}
.art-bg-stars{
  position:absolute;inset:0;
  background-image:
    radial-gradient(circle at 15% 20%, rgba(255,255,255,.75) 1px, transparent 1.6px),
    radial-gradient(circle at 85% 15%, rgba(255,240,200,.85) 1.2px, transparent 1.8px),
    radial-gradient(circle at 35% 65%, rgba(255,255,255,.55) 1px, transparent 1.6px),
    radial-gradient(circle at 75% 75%, rgba(255,200,230,.65) 1.2px, transparent 1.8px),
    radial-gradient(circle at 50% 85%, rgba(200,230,255,.55) 1px, transparent 1.6px);
  background-size:240px 240px;
  opacity:.65;
  pointer-events:none;
  animation:starsTwinkle 4s ease-in-out infinite alternate;
}
.art-bg-aurora{
  position:absolute;bottom:-12%;left:-10%;right:-10%;height:45%;
  background:radial-gradient(ellipse at 50% 100%,rgba(255,143,163,.15) 0%,rgba(179,136,255,.09) 45%,transparent 75%);
  pointer-events:none;
}
.art-loader-shell{
  position:relative;z-index:2;
  display:flex;flex-direction:column;align-items:center;text-align:center;
  max-width:460px;width:88%;gap:16px;
}
.art-logo-stage{
  position:relative;perspective:900px;
  display:flex;align-items:center;justify-content:center;
  padding:14px 0;
}
.art-halo-ring{
  position:absolute;
  width:min(280px,76vw);height:min(280px,76vw);
  border:2px solid rgba(255,218,160,.4);
  border-radius:50%;
  box-shadow:0 0 45px rgba(255,190,120,.28),inset 0 0 35px rgba(180,140,255,.22);
  animation:spinHalo 14s linear infinite;
  pointer-events:none;
}
.art-halo-ring.inner{
  width:min(235px,64vw);height:min(235px,64vw);
  border:1px dashed rgba(255,180,210,.35);
  animation:spinHaloRev 10s linear infinite;
}
.art-sparkle{
  position:absolute;color:#ffe6a3;font-size:14px;
  text-shadow:0 0 10px #ffe6a3;
  animation:sparkleFloat 3s ease-in-out infinite alternate;
  pointer-events:none;
}
.art-sparkle.s1{top:4%;right:12%;animation-delay:0s}
.art-sparkle.s2{bottom:10%;left:8%;animation-delay:1s;font-size:16px;color:#ffc2d1}
.art-sparkle.s3{top:45%;left:2%;animation-delay:2s;font-size:11px}
.art-spinning-logo{
  width:min(290px,78vw);height:auto;
  transform-style:preserve-3d;
  animation:artLogoSpin 3.2s cubic-bezier(.45,.05,.25,.95) infinite;
  filter:drop-shadow(0 15px 30px rgba(70,40,120,.45)) drop-shadow(0 0 20px rgba(255,200,140,.4));
}
.art-info-panel{
  display:flex;flex-direction:column;align-items:center;
  width:100%;gap:10px;
}
.art-title-wrap{
  display:flex;flex-direction:column;align-items:center;gap:3px;
}
.art-subtitle{
  font-size:9.5px;letter-spacing:.32em;color:#bcaecb;
  font-weight:700;text-transform:uppercase;
}
.art-loading-header{
  margin:0;
  font-family:'Anton',Impact,sans-serif;
  font-size:clamp(28px,6vw,44px);
  letter-spacing:.22em;color:#fff8ee;
  text-shadow:0 2px 6px rgba(0,0,0,.7),0 0 24px rgba(255,210,150,.45);
}
.art-dots i{
  font-style:normal;color:#ffd166;
  display:inline-block;animation:dotFade 1.4s infinite;
}
.art-dots i:nth-child(2){animation-delay:.22s}
.art-dots i:nth-child(3){animation-delay:.44s}
.art-bar-shell{
  width:100%;height:10px;
  background:rgba(18,14,32,.85);
  border-radius:20px;
  border:1px solid rgba(255,225,175,.35);
  box-shadow:inset 0 2px 6px rgba(0,0,0,.8),0 0 16px rgba(255,180,120,.2);
  position:relative;overflow:hidden;
  margin-top:2px;
}
.art-bar-fill{
  height:100%;
  background:linear-gradient(90deg,#a084dc,#ff8fa3,#ffd166,#fff3b0);
  border-radius:20px;
  transition:width .25s ease-out;
  box-shadow:0 0 16px rgba(255,209,102,.7);
  position:relative;
}
.art-bar-head{
  position:absolute;right:-4px;top:50%;transform:translateY(-50%);
  color:#fff;font-size:10px;text-shadow:0 0 8px #fff;
  line-height:1;
}
.art-meta-row{
  display:flex;justify-content:space-between;align-items:center;
  width:100%;font-size:12px;font-weight:700;
  color:#cec1dc;letter-spacing:.04em;
}
.art-status-text{
  color:#ffd9a8;text-shadow:0 1px 4px rgba(0,0,0,.6);
}
.art-pct-text{
  font-family:'Anton',Impact,sans-serif;
  font-size:18px;color:#fff8ee;letter-spacing:.05em;
  text-shadow:0 0 12px rgba(255,209,102,.6);
}
.art-tip-card{
  display:flex;align-items:center;gap:12px;
  background:rgba(25,20,44,.75);
  border:1px solid rgba(255,215,160,.22);
  border-radius:10px;
  box-shadow:0 8px 24px rgba(0,0,0,.5);
  backdrop-filter:blur(6px);
  padding:8px 14px;width:100%;margin-top:4px;
}
.art-tip-tag{
  background:linear-gradient(135deg,#ffd166,#ff8fa3);
  color:#15102a;
  font-family:'Anton',Impact,sans-serif;
  font-size:11px;font-style:italic;
  padding:2px 7px;border-radius:4px;
  font-weight:900;letter-spacing:.06em;
  flex-shrink:0;
}
.art-tip-body{
  margin:0;font-size:12px;font-weight:600;
  color:#dfd6ea;line-height:1.35;text-align:left;
}
.art-tip-body b{color:#ffe4aa}
@keyframes artLogoSpin{
  0%{transform:perspective(900px) rotateY(0deg) translateY(0px);filter:drop-shadow(0 12px 25px rgba(70,40,120,.4)) drop-shadow(0 0 18px rgba(255,200,140,.4))}
  50%{transform:perspective(900px) rotateY(180deg) translateY(-6px) scale(1.03);filter:drop-shadow(0 18px 35px rgba(255,140,180,.5)) drop-shadow(0 0 32px rgba(255,220,150,.6))}
  100%{transform:perspective(900px) rotateY(360deg) translateY(0px);filter:drop-shadow(0 12px 25px rgba(70,40,120,.4)) drop-shadow(0 0 18px rgba(255,200,140,.4))}
}
@keyframes spinHalo{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes spinHaloRev{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}
@keyframes sparkleFloat{0%{transform:scale(.8) translateY(0);opacity:.5}100%{transform:scale(1.2) translateY(-4px);opacity:1}}
@keyframes starsTwinkle{from{opacity:.45}to{opacity:.85}}
@keyframes dotFade{0%,20%{opacity:0}50%{opacity:1}100%{opacity:0}}
</style>"""

    if css_start != -1 and css_end != -1:
        html = html[:css_start] + new_critical_css + html[css_end:]
        print("1. Replaced critical styles in index.html with artistic anime aesthetic.")

    # Replace loading screen HTML markup
    markup_start = html.find('<!-- ==================================================================== -->\n<!-- PANTALLA DE CARGA')
    if markup_start == -1:
        markup_start = html.find('<div id="loading-screen"')
    
    markup_end = html.find('<div id="spear-recovery"', markup_start)
    if markup_start != -1 and markup_end != -1:
        new_markup = """<!-- ==================================================================== -->
<!-- PANTALLA DE CARGA SUPER ARTÍSTICA ANIME (Makoto Shinkai / Pastel Ghibli)-->
<!-- ==================================================================== -->
<div id="loading-screen" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="15" aria-label="Cargando CalFight">
  <div class="art-bg-sky"></div>
  <div class="art-bg-stars"></div>
  <div class="art-bg-aurora"></div>

  <div class="art-loader-shell">
    <!-- Logo central con halo celestial anime girando -->
    <div class="art-logo-stage">
      <div class="art-halo-ring"></div>
      <div class="art-halo-ring inner"></div>
      <div class="art-sparkle s1">✦</div>
      <div class="art-sparkle s2">✦</div>
      <div class="art-sparkle s3">✦</div>
      <img src="assets/calfight_logo.png" alt="CalFight" class="art-spinning-logo">
    </div>

    <!-- Título artístico y texto de carga -->
    <div class="art-info-panel">
      <div class="art-title-wrap">
        <span class="art-subtitle">PELEAS ANIME · CIUDAD DE BLOQUES</span>
        <h2 class="art-loading-header">C A R G A N D O<span class="art-dots"><i>.</i><i>.</i><i>.</i></span></h2>
      </div>

      <!-- Barra de energía anime celestial -->
      <div class="art-bar-shell">
        <div id="loading-bar-fill" class="art-bar-fill" style="width: 15%">
          <div class="art-bar-head">✦</div>
        </div>
      </div>

      <div class="art-meta-row">
        <span id="loading-status" class="art-status-text">Invocando el mundo de bloques...</span>
        <span id="loading-pct" class="art-pct-text">15%</span>
      </div>

      <!-- Tarjeta artística de consejo con pergamino anime -->
      <div class="art-tip-card">
        <div class="art-tip-tag">✦ CONSEJO ✦</div>
        <p id="loading-tip" class="art-tip-body">Presiona <b>SHIFT</b> durante el combate para activar <b>Shift Lock</b> y fijar la cámara en tu rival.</p>
      </div>
    </div>
  </div>
</div>
<div id="loading-flash"></div>

<script>
// Animación fluida de precarga mientras descargan los scripts pesados de red
(function(){
  var p = 15;
  var bar = document.getElementById('loading-bar-fill');
  var pct = document.getElementById('loading-pct');
  var status = document.getElementById('loading-status');
  var steps = [
    { target: 35, text: "Despertando la ciudad de bloques..." },
    { target: 60, text: "Cargando peleadores y animaciones 3D..." },
    { target: 82, text: "Sintonizando shaders y auras cel-shaded..." },
    { target: 94, text: "Preparando escenario anime..." }
  ];
  var sIdx = 0;
  window.__artBootTimer = setInterval(function() {
    if (window.__loaderReady) { clearInterval(window.__artBootTimer); return; }
    if (sIdx < steps.length) {
      if (p < steps[sIdx].target) {
        p += 1.8;
        if (bar) bar.style.width = p.toFixed(0) + '%';
        if (pct) pct.textContent = p.toFixed(0) + '%';
        if (status && steps[sIdx].text) status.textContent = steps[sIdx].text;
      } else {
        sIdx++;
      }
    }
  }, 90);
})();
</script>

"""
        html = html[:markup_start] + new_markup + html[markup_end:]
        print("2. Inserted artistic anime markup and inline boot progress timer.")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html updated successfully!")

    # =========================================================================
    # 2. UPDATE js/game.js (CINEMATIC TRANSITION TO MENU)
    # =========================================================================
    with open('js/game.js', 'r', encoding='utf-8') as f:
        js = f.read()

    old_loader_finish = """  finish() {
    if (this.done) return;
    this.done = true;
    this.setProgress(100, '¡A PELEAR!');
    if (this.tipTimer) clearInterval(this.tipTimer);
    setTimeout(() => {
      if (this.el) {
        this.el.classList.add('loader-done');
        setTimeout(() => { if (this.el) this.el.style.display = 'none'; }, 500);
      }
    }, 320);
  }"""

    new_loader_finish = """  finish() {
    if (this.done) return;
    this.done = true;
    window.__loaderReady = true;
    this.setProgress(100, '¡BIENVENIDO A CALFIGHT!');
    if (this.tipTimer) clearInterval(this.tipTimer);
    if (window.__artBootTimer) clearInterval(window.__artBootTimer);

    setTimeout(() => {
      // 1. Destello suave anime
      const fl = $('loading-flash');
      if (fl) {
        fl.style.opacity = '0.90';
        fl.style.transition = 'opacity 0.4s ease';
      }

      // 2. Transición cinematográfica directa al MENÚ (Selección de Personajes)
      setTimeout(() => {
        if (typeof titleFinish === 'function' && TITLE.on) {
          titleFinish();
        } else {
          $('title').classList.add('hidden');
          $('menu').classList.remove('hidden');
          G.state = 'menu';
          if (typeof showSelect === 'function') showSelect(G.charId);
        }

        // 3. Desvanecer la pantalla de carga con zoom y desenfoque
        if (this.el) {
          this.el.classList.add('loader-done');
        }

        // 4. Disolver el destello suavemente
        setTimeout(() => {
          if (fl) {
            fl.style.transition = 'opacity 0.7s ease';
            fl.style.opacity = '0';
          }
          setTimeout(() => {
            if (this.el) this.el.style.display = 'none';
            if (fl) fl.style.display = 'none';
          }, 750);
        }, 150);
      }, 350);
    }, 450);
  }"""

    if old_loader_finish in js:
        js = js.replace(old_loader_finish, new_loader_finish, 1)
        print("3. Replaced LOADER.finish() with cinematic transition straight to MENU.")
    else:
        print("Warning: old_loader_finish not found in js/game.js")

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("js/game.js updated successfully!")

    # =========================================================================
    # 3. SYNC TO CalFight-App
    # =========================================================================
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        shutil.copy2('js/game.js', os.path.join(dest_app, 'js', 'game.js'))
        print("Synced to CalFight-App bundle!")

if __name__ == '__main__':
    main()
