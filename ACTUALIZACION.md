# Actualización: Sekza y ambiente

- **R de Sekza:** especial de movilidad, separado de los cuatro ataques. Vuelo de 3,5 segundos, recarga de 8 segundos. WASD mueve, Espacio sube y C baja. Fuera de la playa, R permite terminar el vuelo antes.
- **Doble R en la playa:** seis gaviotas atacan hasta tres rivales cercanos, sin atacar al dueño. Alcance de 32 metros; recarga de 14 segundos. El daño y los efectos se reproducen en la sala sin duplicar golpes.
- **Iluminación:** se redujeron la luz solar, el bloom y el brillo especular, y se reemplazó la curva que sobreexponía los colores. Se conserva el sombreado de dibujo animado.
- **Casino Aurora:** local de 26 × 22 metros, con recepción, cuatro mesas, máquinas, ruleta decorativa, bar y salón. Se conserva la ciudad ampliada, los edificios de Blockbench, la costa y el vóley playa existentes.
- Se quitaron los carteles de refugio. Los rayos caen sin aviso de suelo y son más frecuentes y más propensos a alcanzar jugadores expuestos durante las tormentas.
- El servidor mantiene la hora, el clima y los rayos comunes por sala. Los controles ambientales son del anfitrión; la calidad gráfica y el sonido siguen siendo preferencias de cada jugador.

Comprobación: vuelo y aterrizaje, ascenso/descenso, recargas, objetivos cercanos, inmunidad del dueño, reproducción remota, dos jugadores en un servidor, clima compartido, rayos y ausencia de daño duplicado. Informe en VERIFICACION-ACTUALIZACION.json.

Pruebas de desarrollo: `npm run test:sekza`, `npm run test:multijugador` y `npm run test:ambiente`, con Playwright y Chrome instalados.
