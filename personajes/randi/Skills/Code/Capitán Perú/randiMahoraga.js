/* Habilidad: Capitán Perú  ·  personaje: randi  ·  movimiento: randiMahoraga
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// La gran invocación: solo si hay un rival cerca; gasta 12 s del despertar (en Jujutsu Shenanigans gasta el 40 % de la barra)
CF.mover('randiMahoraga', function (f, o) {
    const tg = enemiesOf(f).filter(g => dist2d(f, g) < 9).sort((a, b) => dist2d(f, a) - dist2d(f, b))[0];
    if (!tg || f.awak < 4 || f.capRandi) { if (f.isPlayer) popText(chestOf(f), f.capRandi ? 'Ya está invocado' : f.awak < 4 ? 'Poco despertar' : 'Acércate a un rival', '#ffb3b8', 18); return false; }
    if (!(G.rules.ultInf && f.isPlayer)) f.awak = Math.max(.5, f.awak - 12); randiSummon(f, tg);
  });
