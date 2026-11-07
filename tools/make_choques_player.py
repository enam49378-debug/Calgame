import base64
import pathlib

art_dir = pathlib.Path(r'C:\Users\jesul\.gemini\antigravity\brain\e26a432e-2823-4399-8b3c-42d54762ee33')
b64_ident = base64.b64encode(open(r'F:\blockstrike\musica\hypnotic_choques_identico.mp3', 'rb').read()).decode('ascii')
b64_inter = base64.b64encode(open(r'F:\blockstrike\musica\hypnotic_choques_intermedio.mp3', 'rb').read()).decode('ascii')
b64_arcade = base64.b64encode(open(r'F:\blockstrike\musica\hypnotic_choques_arcade.mp3', 'rb').read()).decode('ascii')

html_content = f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-4 select-none">
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-5 shadow-lg max-w-lg mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-3">
      <div>
        <h2 class="text-[var(--foreground)] font-bold text-base flex items-center gap-2">
          <span>💥</span> HYPNOTIC DATA (Instrumental • Sin Voz)
        </h2>
        <p class="text-[var(--muted-foreground)] text-xs mt-0.5">Choques Idénticos & Pegada Phonk • 3 Versiones de Juego</p>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="px-2 py-0.5 text-xs font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-mono">0% Voz</span>
        <span class="px-2 py-0.5 text-xs font-semibold rounded-md bg-[var(--background)] text-purple-400 border border-[var(--border)] font-mono">135.9 BPM</span>
      </div>
    </div>

    <!-- 3 Tabs Selector -->
    <div class="grid grid-cols-3 gap-1.5 mb-4 p-1 bg-[var(--background)] rounded-xl border border-[var(--border)]">
      <button id="tab-ident" onclick="switchTrack('ident')" class="py-2 px-2 text-xs font-bold rounded-lg transition-all bg-[var(--card)] text-[var(--foreground)] shadow-sm text-center">
        💥 1. Choques Idénticos
      </button>
      <button id="tab-inter" onclick="switchTrack('inter')" class="py-2 px-2 text-xs font-semibold rounded-lg transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-center">
        ⚡ 2. Intermedio
      </button>
      <button id="tab-arcade" onclick="switchTrack('arcade')" class="py-2 px-2 text-xs font-semibold rounded-lg transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-center">
        🕹️ 3. Arcade Retro
      </button>
    </div>

    <!-- Track Info Card -->
    <div class="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 mb-4">
      <div class="flex justify-between items-center text-xs">
        <span id="track-title" class="font-bold text-[var(--foreground)]">💥 Versión 1: Choques Idénticos Phonk (Sin Voz)</span>
        <span id="track-dur" class="text-[var(--muted-foreground)] font-mono">0:00 / 0:28</span>
      </div>
      <p id="track-desc" class="text-xs text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
        Los choques exactos de Odetari: acorde stab supersaw distorsionado que golpea seco en cada tiempo, bombo phonk con pegada a 46Hz, sub-bajo 808 pesado y sidechain pumping. Cero voz.
      </p>

      <!-- Visualizer Canvas -->
      <canvas id="visualizer" class="w-full h-16 mt-3 rounded-lg bg-[var(--card)] border border-[var(--border)]"></canvas>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between gap-3">
      <button id="play-btn" onclick="togglePlay()" class="flex-1 py-2.5 px-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <span id="play-icon">▶</span> <span id="play-text">Reproducir</span>
      </button>

      <!-- Loop toggle -->
      <button id="loop-btn" onclick="toggleLoop()" title="Alternar Bucle Infinito" class="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--background)] transition-colors">
        🔁 Loop: <span id="loop-status" class="text-emerald-500">ON</span>
      </button>

      <!-- Volume -->
      <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <span class="text-xs">🔊</span>
        <input type="range" id="vol" min="0" max="1" step="0.05" value="0.8" oninput="setVolume(this.value)" class="w-16 accent-[var(--foreground)] h-1.5 bg-[var(--border)] rounded-lg cursor-pointer">
      </div>
    </div>

    <!-- File reference -->
    <div class="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs text-[var(--muted-foreground)]">
      <span>📁 <code id="file-name" class="font-mono text-[var(--foreground)]">musica/hypnotic_choques_identico.mp3</code></span>
      <span class="font-mono text-emerald-400">Loop 28.27s</span>
    </div>
  </div>

  <audio id="audio-ident" loop src="data:audio/mp3;base64,{b64_ident}"></audio>
  <audio id="audio-inter" loop src="data:audio/mp3;base64,{b64_inter}"></audio>
  <audio id="audio-arcade" loop src="data:audio/mp3;base64,{b64_arcade}"></audio>

  <script>
    let currentMode = 'ident';
    let isPlaying = false;
    let isLooping = true;
    const aIdent = document.getElementById('audio-ident');
    const aInter = document.getElementById('audio-inter');
    const aArcade = document.getElementById('audio-arcade');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const loopStatus = document.getElementById('loop-status');
    const trackTitle = document.getElementById('track-title');
    const trackDesc = document.getElementById('track-desc');
    const trackDur = document.getElementById('track-dur');
    const fileName = document.getElementById('file-name');
    const tabIdent = document.getElementById('tab-ident');
    const tabInter = document.getElementById('tab-inter');
    const tabArcade = document.getElementById('tab-arcade');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    const tabActive = 'py-2 px-2 text-xs font-bold rounded-lg transition-all bg-[var(--card)] text-[var(--foreground)] shadow-sm text-center';
    const tabInactive = 'py-2 px-2 text-xs font-semibold rounded-lg transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-center';

    function getAudio() {{
      if (currentMode === 'ident') return aIdent;
      if (currentMode === 'inter') return aInter;
      return aArcade;
    }}

    function switchTrack(mode) {{
      const wasPlaying = isPlaying;
      if (isPlaying) {{
        getAudio().pause();
        getAudio().currentTime = 0;
      }}
      currentMode = mode;
      tabIdent.className = mode === 'ident' ? tabActive : tabInactive;
      tabInter.className = mode === 'inter' ? tabActive : tabInactive;
      tabArcade.className = mode === 'arcade' ? tabActive : tabInactive;

      if (mode === 'ident') {{
        trackTitle.textContent = '💥 Versión 1: Choques Idénticos Phonk (Sin Voz)';
        trackDesc.textContent = 'Los choques exactos de Odetari: acorde stab supersaw distorsionado que golpea seco en cada tiempo, bombo phonk con pegada a 46Hz, sub-bajo 808 pesado y sidechain pumping. Cero voz.';
        fileName.textContent = 'musica/hypnotic_choques_identico.mp3';
      }} else if (mode === 'inter') {{
        trackTitle.textContent = '⚡ Versión 2: Intermedia (Choques Pesados + Capas Arcade)';
        trackDesc.textContent = 'El punto medio: conserva toda la fuerza y el crunch de los choques y bombos de la original, pero incorpora arpegios de 16-bit arcade en estéreo para ambientar la pelea.';
        fileName.textContent = 'musica/hypnotic_choques_intermedio.mp3';
      }} else {{
        trackTitle.textContent = '🕹️ Versión 3: Arcade Retro Hardcore (16-bit)';
        trackDesc.textContent = 'Sonido arcade agresivo con choques duros, redobles chiptune y sintetizador solista punteado para combates intensos.';
        fileName.textContent = 'musica/hypnotic_choques_arcade.mp3';
      }}
      getAudio().loop = isLooping;
      if (wasPlaying) {{
        getAudio().play().catch(() => {{}});
        isPlaying = true;
        playIcon.textContent = '⏸';
        playText.textContent = 'Pausar';
      }}
    }}

    function togglePlay() {{
      const a = getAudio();
      if (isPlaying) {{
        a.pause();
        isPlaying = false;
        playIcon.textContent = '▶';
        playText.textContent = 'Reproducir';
      }} else {{
        a.play().then(() => {{
          isPlaying = true;
          playIcon.textContent = '⏸';
          playText.textContent = 'Pausar';
        }}).catch(e => console.error(e));
      }}
    }}

    function toggleLoop() {{
      isLooping = !isLooping;
      aIdent.loop = isLooping;
      aInter.loop = isLooping;
      aArcade.loop = isLooping;
      loopStatus.textContent = isLooping ? 'ON' : 'OFF';
      loopStatus.className = isLooping ? 'text-emerald-500' : 'text-zinc-500';
    }}

    function setVolume(v) {{
      aIdent.volume = v;
      aInter.volume = v;
      aArcade.volume = v;
    }}

    function fmt(s) {{
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }}

    function updateTime() {{
      const a = getAudio();
      if (a.duration) {{
        trackDur.textContent = fmt(a.currentTime) + ' / ' + fmt(a.duration);
      }}
      requestAnimationFrame(updateTime);
    }}
    updateTime();

    function resizeCanvas() {{
      canvas.width = canvas.clientWidth * window.devicePixelRatio || 300;
      canvas.height = canvas.clientHeight * window.devicePixelRatio || 60;
    }}
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let phase = 0;
    function draw() {{
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const numBars = 36;
      const barWidth = (w / numBars) * 0.7;
      const gap = (w / numBars) * 0.3;

      for (let i = 0; i < numBars; i++) {{
        let barHeight = 4;
        if (isPlaying) {{
          // Punchy bounce effect on the beat
          const pulse = (Math.sin(phase * 4.0) > 0.6) ? 1.4 : 1.0;
          const val = Math.sin(phase * 1.8 + i * 0.32) * Math.cos(phase * 2.5 + i * 0.22);
          barHeight = Math.max(4, (Math.abs(val) * 0.75 + 0.25) * (h * 0.78) * pulse);
        }}
        const x = i * (barWidth + gap) + gap / 2;
        const y = (h - barHeight) / 2;
        const col = currentMode === 'ident' ? '#ef4444' : (currentMode === 'inter' ? '#f59e0b' : '#06b6d4');
        ctx.fillStyle = isPlaying ? col : '#64748b';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }}
      if (isPlaying) phase += 0.09;
      requestAnimationFrame(draw);
    }}
    draw();
  </script>
</body>
</html>'''

out_path = art_dir / 'hypnotic_choques_player.html'
out_path.write_text(html_content, encoding='utf-8')
print('hypnotic_choques_player.html created successfully at:', out_path)
