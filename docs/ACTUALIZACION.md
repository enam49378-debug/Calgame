# Pausa y opciones de sonido

La pausa muestra **Reanudar**, **Opciones** y **Menú**. En Opciones se pueden ajustar por separado el volumen general, el ambiente (lluvia, mar, viento, pájaros y locales) y los efectos del juego (golpes, combos, habilidades y vóley). Los valores van de 0 a 100 % y se guardan en el navegador.

Las opciones existentes de bots y calidad gráfica también están en Opciones. Volver regresa a la pantalla de pausa. Escape regresa desde Opciones y permite reanudar desde la pantalla principal de pausa.

Se comprobó la navegación con teclado y botones, la persistencia al recargar, el aislamiento real de los canales de audio y la reproducción alternativa al abrir el juego sin servidor. Prueba de desarrollo: `npm run test:audio`.

---

# Actualización: Sekza y ambiente

- **R de Sekza:** especial de movilidad, separado de los cuatro ataques. Vuelo de 3,5 segundos, recarga de 8 segundos. WASD mueve, Espacio sube y C baja. Fuera de la playa, R permite terminar el vuelo antes.
- **Doble R en la playa:** seis gaviotas atacan hasta tres rivales cercanos, sin atacar al dueño. Alcance de 32 metros; recarga de 14 segundos. El daño y los efectos se reproducen en la sala sin duplicar golpes.
- **Iluminación:** se redujeron la luz solar, el bloom y el brillo especular, y se reemplazó la curva que sobreexponía los colores. Se conserva el sombreado de dibujo animado.
- **Casino Aurora:** local de 26 × 22 metros, con recepción, cuatro mesas, máquinas, ruleta decorativa, bar y salón. Se conserva la ciudad ampliada, los edificios de Blockbench, la costa y el vóley playa existentes.
- Se quitaron los carteles de refugio. Los rayos caen sin aviso de suelo y son más frecuentes y más propensos a alcanzar jugadores expuestos durante las tormentas.
- El servidor mantiene la hora, el clima y los rayos comunes por sala. Los controles ambientales son del anfitrión; la calidad gráfica y el sonido siguen siendo preferencias de cada jugador.

Comprobación: vuelo y aterrizaje, ascenso/descenso, recargas, objetivos cercanos, inmunidad del dueño, reproducción remota, dos jugadores en un servidor, clima compartido, rayos y ausencia de daño duplicado. Informe en VERIFICACION-ACTUALIZACION.json.

Pruebas de desarrollo: `npm run test:sekza`, `npm run test:multijugador` y `npm run test:ambiente`, con Playwright y Chrome instalados.

---
# Actualización del mar profundo

- **Mar profundo y oscuro:** a partir de ~60 m de la orilla el agua se oscurece hasta casi negro (superficie, fondo y niebla bajo el agua); en lo más hondo solo se ve el plancton y las luces de los animales.
- **Tiburones solo en lo profundo:** patrullan a más de ~90 m de la orilla y solo atacan a quien nada ahí. En el evento *Frenesí* salen 3 más y suben un poco hacia la costa.
- **Animales nuevos:** mantarrayas que ondulan, tortugas marinas, 18 medusas luminosas que laten, peces abisales (rape) con su linterna y un calamar gigante.
- **Eventos del mar** (aparecen solos cada 55-95 s; se pueden apagar o lanzar a mano en Opciones > Partida y eventos marinos): 🐟 *Cardumen gigante*, 🦈 *Frenesí de tiburones*, ✨ *Marea luminosa* y 🦑 *Calamar gigante*. La ballena saltarina sigue como antes.
- **Cartel:** el panel del centro comercial anuncia la actualización (`assets/billboard/ad_mar.jpg`, se regenera con `python tools/gen_cartel_mar.py`).

## Emotes

- Mantené **B** (se cambia en Opciones > Controles; la guía pasó a **K**) para abrir la **rueda de 12 slots**: movés el mouse hacia un emote y soltás. También hay un botón 😀 arriba, junto a Panel y Guía, y en celular un botón flotante.
- Cada slot muestra **tu modelo haciendo el emote** en vivo.
- **Clic derecho sobre un slot:** se abre la lista de emotes sin cerrar la rueda; tocás uno y se cambia el emote de ese slot.
- Hay **60 emotes**: 15 de poses (Saludo, Karate, Moonwalk…) y 45 animaciones hechas en Blockbench (Dab, Griddy, Thriller, Rueda, Breakdance, Hyperpop…).
- Se desbloquean con **kills, como en TSB**: unos pocos al empezar y el resto desde 2 hasta 390 kills.
- **Solo cuentan las kills en salas públicas contra otros jugadores.** No cuentan las salas privadas, jugar solo, los bots ni los dummies.
- Los emotes solo existen dentro de la partida. Los demás jugadores ven tu emote. Cualquier movimiento, ataque o golpe lo cancela.
- Código: `js/emotes.js`; las animaciones se generan con `python tools/bbmodel_a_emotes.py Emotes.bbmodel` (`js/emote_list.js` + `js/emote_clips.js`, este último se baja solo cuando hace falta).

## Itsukio (ItzUkyo)

Más vida (100 → 112), más velocidad (1.04 → 1.09), más daño (×0.72 → ×0.86), recargas más cortas y números de daño algo más altos en todas sus habilidades. Espada de Fénix dura 12 s.

## Seguridad de las cuentas

Contraseñas fuertes, freno a intentos fallidos, sesión opcional por pestaña, cambio de contraseña y reglas de Firestore más estrictas. Ver [SEGURIDAD.md](SEGURIDAD.md) (incluye lo que hay que activar en la consola de Firebase).

# El mar grande, el torbellino y el Kraken

- **Mar mucho más grande:** ahora llega a ~540 m de la costa y ±350 m de ancho, con rocas, corales luminosos y fondo cada vez más oscuro.
- **Eventos del mar más difíciles de ver:** aparecen solos cada **5 a 9 minutos** (antes cada 1 minuto).
- **Torbellino gigante** en el mar profundo (una columna de luz azul y la señal «EL ABISMO» se ven desde lejos): absorbe poco a poco a quien nada cerca. En el borde se puede escapar nadando; más adentro ya no. Al llegar al centro **caes por una cascada** a la cueva del **Abismo**, muy por debajo del mar.
- **El Abismo:** una cueva enorme con ruinas, cristales luminosos, algas gigantes y un barco hundido. La salida (portal «SUPERFICIE») se abre cuando derrotas al jefe.
- **Jefe final: el KRAKEN.** Un calamar gigante con 1500 de vida y 5 ataques: **Aplastamiento** (tentáculos que salen del suelo donde marca el círculo rojo), **Barrido** (hay que saltarlo), **Tinta** (charcos que queman y frenan), **Succión** (te arrastra al centro y explota) y, al enfurecerse con la mitad de la vida, **Rayos de los ojos**. Se le pega con **las habilidades de tu personaje**; las cinemáticas de agarre no funcionan con él (le hacen daño directo). Cada jugador pelea con su propio Kraken.
- **Recompensas:** la primera vez da el emote «Furia del Kraken» y los cosméticos «Corona del Abismo» y «Aura abisal»; las siguientes victorias dan «Tentáculos», «Rey del abismo», «Alas del Kraken», «Ojos del Kraken» y «Hombreras del abismo».
- **Evento «Calamar gigante»:** cuando ocurre, el torbellino brilla más y se avisa que el Kraken despertó.

# Cosméticos (estilo anime / cine épico)

- Botón **👑** arriba, junto a Panel, Guía y Emotes: eliges un cosmético por espacio (cabeza, cara, espalda, hombros y aura). Los demás jugadores los ven.
- Halo dorado, cuernos de Oni, capa épica, katana a la espalda, máscara Kitsune, hombreras de samurái, aura dorada, alas de ángel y ojos de energía se consiguen con **kills en salas públicas** (las mismas que los emotes). Los del abismo, derrotando al Kraken.
- Código: `js/cosmetics.js`, `js/abismo.js`.
