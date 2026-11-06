# Personajes de CalFight

Cada personaje vive en su propia carpeta: `personajes/<id>/`

```
personajes/
  _lista.js          orden en el menú + registro (se carga primero)
  mattux/
    personaje.js     estadísticas, habilidades, despertar, ataques básicos, consejos
    skin.png         su skin (reemplázala por otra del mismo tamaño y listo)
  gato/ ...
  _sin_usar/         Kaiza, Nyx, Volt, Brasa, Yuki y Titán (no se cargan, ver su LEEME)
```

## Qué se edita en `personaje.js`

| Campo | Qué es |
|---|---|
| `name`, `title`, `role`, `desc`, `color` | texto y color que salen en el menú |
| `hp`, `spd`, `dmgMul` | vida, velocidad y multiplicador de daño (equilibrio) |
| `skills` | las 4 habilidades normales: `cd` recarga, `o.dmg` daño, `r` alcance, `tags` |
| `awk` | las 4 habilidades que reemplazan a las normales al despertar |
| `ult` | la habilidad definitiva |
| `m1set` | combo de 5 golpes del clic izquierdo (animación, alcance, arco) |
| `consejos` | textos del Libro de habilidades (S1-S4, A1-A4, U) |
| `skinData` | ruta de la skin (`personajes/<id>/skin.png`) |

El campo `k` de cada habilidad es el nombre del movimiento. Esos movimientos están
programados en `js/game.js`, dentro del objeto `MOVES`. Para cambiar **cómo funciona**
una habilidad hay que editar ahí; para cambiar su **daño, recarga o alcance** basta con
este archivo.

## Añadir un personaje nuevo

1. Copia una carpeta (por ejemplo `personajes/mattux`) y cámbiale el nombre.
2. Dentro de `personaje.js` cambia el id en `CF_PERSONAJES['...']` y los datos.
3. Añade el id a `CF_ORDEN` en `personajes/_lista.js`.
4. Añade `<script src="personajes/<id>/personaje.js"></script>` en `index.html`, antes de `js/game.js`.
5. Si cambias archivos, sube el número `?v=` de los scripts para que el navegador no use la caché.

## Qué sigue en `js/game.js` (todavía no separado)

- Los movimientos de las habilidades (`MOVES`), las cinemáticas (`CHORE`) y las voces/sonidos
  de cada personaje (`sonidos/<id>/`, `musica/ulti/<id>.mp3`).
