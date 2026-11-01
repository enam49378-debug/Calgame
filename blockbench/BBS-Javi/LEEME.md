# Javi desde BBS

- `idle_bbs.json`: la película `idle.dat` (BBS) leída con `tools/bbsparse.py`.
- `tools/import_bbs_idle.py`: la convierte en el clip `idle` de Javi (60 fps, bucle de 6 s). La idle anterior queda como `idle_anterior`.
- `ojos_modelo_bbs.json` + `ojos_javiv.png`: los ojos 3D (modelo `player/eyes` con la textura `javiv.png`). Van dentro de `index.html` (`BBS_EYES`); se ven cuando la cara está en reposo o parpadeando.
- La lanza (`Calgame/Armas/Javi`) es la misma `Lanza-Javi` de la carpeta vecina.
