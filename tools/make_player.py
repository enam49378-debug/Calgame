import base64
import pathlib

art_dir = pathlib.Path(r'C:\Users\jesul\.gemini\antigravity\brain\e26a432e-2823-4399-8b3c-42d54762ee33')
b64_game = base64.b64encode(open(r'F:\blockstrike\musica\she_bugging_game.mp3', 'rb').read()).decode('ascii')
b64_loop = base64.b64encode(open(r'F:\blockstrike\musica\she_bugging_loop.mp3', 'rb').read()).decode('ascii')

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
          <span>🎮</span> She Bugging (Whatchu Gonna Do)
        </h2>
        <p class="text-[var(--muted-foreground)] text-xs mt-0.5">Recreación & Audio para BlockStrike / Videojuegos</p>
      </div>
      <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]">124.7 BPM</span>
    </div>

    <!-- Mode Selector Tabs -->
    <div class="grid grid-cols-2 gap-2 mb-4 p-1 bg-[var(--background)] rounded-xl border border-[var(--border)]">
      <button id="tab-game" onclick="switchTrack('game')" class="py-2 px-3 text-xs font-bold rounded-lg transition-all bg-[var(--card)] text-[var(--foreground)] shadow-sm">
        🕹️ Arcade Game Synth
      </button>
      <button id="tab-loop" onclick="switchTrack('loop')" class="py-2 px-3 text-xs font-semibold rounded-lg transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        🎧 Loop Original Master
      </button>
    </div>

    <!-- Track Info Card -->
    <div class="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 mb-4">
      <div class="flex justify-between items-center text-xs">
        <span id="track-title" class="font-bold text-[var(--foreground)]">🕹️ Versión Videojuego (Arcade Chiptune)</span>
        <span id="track-dur" class="text-[var(--muted-foreground)] font-mono">0:00 / 0:30</span>
      </div>
      <p id="track-desc" class="text-xs text-[var(--muted-foreground)] mt-1">
        Sintetizadores supersaw, sub-bajo 808 con glides, ritmo Jersey Club bounce y arpegios arcade.
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

    <!-- Footer file path -->
    <div class="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs text-[var(--muted-foreground)]">
      <span>📁 Guardado en <code class="font-mono text-[var(--foreground)]">musica/</code></span>
      <span class="font-mono">-16.0 LUFS</span>
    </div>
  </div>

  <audio id="audio-game" loop src="data:audio/mp3;base64,{b64_game}"></audio>
  <audio id="audio-loop" loop src="data:audio/mp3;base64,{b64_loop}"></audio>

  <script>
    let currentMode = 'game';
    let isPlaying = false;
    let isLooping = true;
    const aGame = document.getElementById('audio-game');
    const aLoop = document.getElementById('audio-loop');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const loopStatus = document.getElementById('loop-status');
    const trackTitle = document.getElementById('track-title');
    const trackDesc = document.getElementById('track-desc');
    const trackDur = document.getElementById('track-dur');
    const tabGame = document.getElementById('tab-game');
    const tabLoop = document.getElementById('tab-loop');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    function getAudio() {{
      return currentMode === 'game' ? aGame : aLoop;
    }}

    function switchTrack(mode) {{
      const wasPlaying = isPlaying;
      if (isPlaying) {{
        getAudio().pause();
        getAudio().currentTime = 0;
      }}
      currentMode = mode;
      if (mode === 'game') {{
        tabGame.className = 'py-2 px-3 text-xs font-bold rounded-lg transition-all bg-[var(--card)] text-[var(--foreground)] shadow-sm';
        tabLoop.className = 'py-2 px-3 text-xs font-semibold rounded-lg transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)]';
        trackTitle.textContent = '🕹️ Versión Videojuego (Arcade Chiptune)';
        trackDesc.textContent = 'Sintetizadores supersaw, sub-bajo 808 con glides, ritmo Jersey Club bounce y arpegios arcade.';
      }} else {{
        tabLoop.className = 'py-2 px-3 text-xs font-bold rounded-lg transition-all bg-[var(--card)] text-[var(--foreground)] shadow-sm';
        tabGame.className = 'py-2 px-3 text-xs font-semibold rounded-lg transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)]';
        trackTitle.textContent = '🎧 Loop Original Masterizado (Emote)';
        trackDesc.textContent = 'Loop continuo sin ruidos (8 compases, 15.4s) con micro-crossfade a -16 LUFS estándar del juego.';
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
      aGame.loop = isLooping;
      aLoop.loop = isLooping;
      loopStatus.textContent = isLooping ? 'ON' : 'OFF';
      loopStatus.className = isLooping ? 'text-emerald-500' : 'text-zinc-500';
    }}

    function setVolume(v) {{
      aGame.volume = v;
      aLoop.volume = v;
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

    // Canvas visualizer animation
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
          const val = Math.sin(phase + i * 0.35) * Math.cos(phase * 1.5 + i * 0.2);
          barHeight = Math.max(4, (Math.abs(val) * 0.75 + 0.25) * (h * 0.75));
        }}
        const x = i * (barWidth + gap) + gap / 2;
        const y = (h - barHeight) / 2;
        ctx.fillStyle = isPlaying ? '#10b981' : '#64748b';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }}
      if (isPlaying) phase += 0.08;
      requestAnimationFrame(draw);
    }}
    draw();
  </script>
</body>
</html>'''

out_path = art_dir / 'music_player.html'
out_path.write_text(html_content, encoding='utf-8')
print('music_player.html created successfully at:', out_path)
