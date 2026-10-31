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
