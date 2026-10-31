# Edificios de la ciudad (Blockbench)

Cada `.bbmodel` es un edificio. Ábrelo en Blockbench (**Archivo → Abrir modelo**), edítalo y guárdalo en la misma ruta.

- **Escala:** 1 bloque de Minecraft (16 px) = 1 metro del juego. El **frente mira a +Z** (sur). El modelo se centra en X/Z y el suelo es Y = 0.
- **Textura:** todos comparten `atlas.png` (tiles de 32×32 px, 8 px = 1 m). Los tiles que están en la parte baja del atlas (**y ≥ 640 px**) brillan solos en el juego: lámparas, neón, pantallas, faroles.
- **Colisiones:** los cubos del grupo llamado **`colision`** no se dibujan; el juego los usa como obstáculos (mesas, mostradores, estantes…). Edítalos igual que cualquier cubo.
- **Muros, puertas y techo** del edificio tienen su colisión en el código del juego (tamaño en `CITY_MODEL_DIMS`, puertas de 3.2 m de ancho y 3.0 m de alto, techo interior en `base`). Si cambias el tamaño de un edificio hay que ajustarlo allí.
- **Sin servidor** (abrir `index.html` con doble clic) el juego lee las copias `.js`. Para regenerarlas a partir de tus `.bbmodel`:  
  `python -c "import sys; sys.path.insert(0,'tools'); import gen_edificios as G; G.export_js()"`
- `python tools/gen_ciudad.py` regenera **todo** desde cero (sobrescribe los `.bbmodel`).

Edificios con interior: `cafe`, `arcade`, `mercado`, `biblioteca`, `ramen`, `taller`, `centro_comercial`, `torre_aurora`.
