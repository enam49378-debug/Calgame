# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Wiring LOADER into js/game.js...")

    with open('js/game.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add LOADER object definition near top of file
    target_top = "const _c = new THREE.Color();"
    loader_def = """const _c = new THREE.Color();

// ====================================================================
// PANTALLA DE CARGA ANIME DINÁMICA (Web & Desktop)
// ====================================================================
const LOADER = {
  el: null,
  bar: null,
  pct: null,
  status: null,
  tip: null,
  tips: [
    'Presiona SHIFT durante el combate para activar Shift Lock y fijar la cámara en tu rival.',
    'Bloquea con F o botón derecho justo al recibir el ataque para ejecutar un Bloqueo Perfecto.',
    'Alcanzar el 100% de la barra de Ulti desata el Despertar con nuevas habilidades y velocidad.',
    'Esquiva con Dash (tecla Q o doble toque) para cancelar ataques y castigar a tu oponente.',
    'El botón H en partida abre el Panel para cambiar la hora, el clima y entrenar con Dummies.',
    'Puedes personalizar y desbloquear hasta 200 FPS en el menú de Ajustes Gráficos.'
  ],
  tipIdx: 0,
  tipTimer: null,
  progress: 15,
  done: false,
  init() {
    this.el = $('loading-screen');
    this.bar = $('loading-bar-fill');
    this.pct = $('loading-pct');
    this.status = $('loading-status');
    this.tip = $('loading-tip');
    if (this.tipTimer) clearInterval(this.tipTimer);
    this.tipTimer = setInterval(() => this.nextTip(), 2500);
    // Timeout de seguridad: nunca dejar la pantalla bloqueada
    setTimeout(() => this.finish(), 6500);
  },
  setProgress(val, text) {
    this.progress = Math.max(this.progress, Math.min(100, val));
    if (this.bar) this.bar.style.width = this.progress.toFixed(0) + '%';
    if (this.pct) this.pct.textContent = this.progress.toFixed(0) + '%';
    if (text && this.status) this.status.textContent = text;
    if (this.el) this.el.setAttribute('aria-valuenow', this.progress.toFixed(0));
  },
  nextTip() {
    if (!this.tip) return;
    this.tipIdx = (this.tipIdx + 1) % this.tips.length;
    this.tip.innerHTML = this.tips[this.tipIdx].replace(/(SHIFT|Shift Lock|F|Bloqueo Perfecto|Ulti|Despertar|Dash|tecla Q|H|Dummies|200 FPS|Ajustes Gráficos)/g, '<b>$1</b>');
  },
  finish() {
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
  }
};
LOADER.init();"""

    if target_top in content and "const LOADER =" not in content:
        content = content.replace(target_top, loader_def, 1)
        print("1. LOADER definition added at start of js/game.js.")

    # 2. Wire loadCharSkins progress tracking
    old_load_skins = """function loadCharSkins() {
  return Promise.all(Object.keys(CHARS).filter(id => CHARS[id].skinData).map(id => new Promise(res => {
    const img = new Image();
    img.onload = () => { const c = normalizeSkin(img); if (c) { CHARS[id].skinCanvas = c; CHARS[id].slim = detectSlim(c); } res(); };
    img.onerror = res; img.src = CHARS[id].skinData;
  })));
}"""

    new_load_skins = """function loadCharSkins() {
  const ids = Object.keys(CHARS).filter(id => CHARS[id].skinData);
  let loaded = 0;
  LOADER.setProgress(30, 'Cargando modelos y skins de peleadores...');
  return Promise.all(ids.map(id => new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const c = normalizeSkin(img);
      if (c) { CHARS[id].skinCanvas = c; CHARS[id].slim = detectSlim(c); }
      loaded++;
      LOADER.setProgress(30 + (loaded / Math.max(1, ids.length)) * 48, 'Cargando peleador ' + loaded + '/' + ids.length + '...');
      res();
    };
    img.onerror = () => {
      loaded++;
      LOADER.setProgress(30 + (loaded / Math.max(1, ids.length)) * 48, 'Cargando peleador ' + loaded + '/' + ids.length + '...');
      res();
    };
    img.src = CHARS[id].skinData;
  })));
}"""

    if old_load_skins in content:
        content = content.replace(old_load_skins, new_load_skins, 1)
        print("2. loadCharSkins hooked with real-time percentage progress.")

    # 3. Hook LOADER.finish() when initial game scene is ready
    old_init_call = "loadCharSkins().then(() => { ensureNormalAll(); renderRoster(); showSelect(G.charId, true); titleStart(); });"
    new_init_call = """loadCharSkins().then(() => {
  LOADER.setProgress(92, 'Generando entorno y shaders cel-shaded...');
  ensureNormalAll();
  renderRoster();
  showSelect(G.charId, true);
  titleStart();
  setTimeout(() => LOADER.finish(), 250);
});"""

    if old_init_call in content:
        content = content.replace(old_init_call, new_init_call, 1)
        print("3. LOADER.finish() hooked to loadCharSkins completion.")

    # 4. Hook intermediate progress in buildSeaWorld
    old_sea = "buildSeaWorld();"
    new_sea = "LOADER.setProgress(22, 'Iniciando ciudad y motores...');\nbuildSeaWorld();\nLOADER.setProgress(28, 'Generando texturas anime...');"
    if old_sea in content and "LOADER.setProgress(22" not in content:
        content = content.replace(old_sea, new_sea, 1)
        print("4. Early progress hooked around buildSeaWorld().")

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("js/game.js updated successfully!")

    # Sync to CalFight-App
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        print("Syncing updated files to CalFight-App bundle...")
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        shutil.copy2('css/style.css', os.path.join(dest_app, 'css', 'style.css'))
        shutil.copy2('js/game.js', os.path.join(dest_app, 'js', 'game.js'))
        print("CalFight-App bundle updated!")

if __name__ == '__main__':
    main()
