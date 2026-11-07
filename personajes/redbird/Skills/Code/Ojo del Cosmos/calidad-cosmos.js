/* "Ojo del Cosmos" · calidad gráfica de la escena. Lee los gráficos que eligió el jugador (GFX.level: 0 Alta · 1 Media · 2 Baja · 3 Mínima · 4 Ultra baja)
   y devuelve cuánto detalle usar: segmentos de las esferas, cantidad de nubes/pájaros/polvo/escombros, y qué adornos se apagan.
   Uso:  const Q = rbCalidad();   Q.q (1 .. .15)  Q.seg (multiplicador de segmentos)  Q.n(base, min) = cantidad escalada  Q.level  Q.post (¿hay post-proceso?) */
const rbCalidad = function () {
  const L = Math.max(0, Math.min(4, GFX.level | 0)), q = [1, .75, .5, .3, .15][L];
  return {
    level: L, q, seg: [1, .78, .56, .4, .28][L],
    post: GFX.post !== false && GFX_CFG.bloom !== 'off',          // ¿hay bloom/gradación de color?
    fancy: L <= 1,                                                  // auroras, 2.ª capa de nubes, planetas lejanos…
    lite: L >= 3,                                                   // lo mínimo: sin extras
    n: (base, min) => Math.max(min == null ? 1 : min, Math.round(base * q)),
    s: (n) => Math.max(8, Math.round(n * [1, .78, .56, .4, .28][L])),
  };
};
