# Activar amigos, DM y roles

El editor de perfiles y las mejoras gráficas funcionan con la actualización del juego. Para compartir perfiles entre equipos, guardar amistades y usar mensajes privados, activá Firestore en el proyecto Firebase **calgame**:

1. Abrí https://console.firebase.google.com/project/calgame/firestore con la cuenta que administra el proyecto.
2. Creá la base **(default)**, **Edición Standard**, en **modo producción**. Conservá la región que hayas elegido al crearla.
3. En **Reglas**, reemplazá el contenido con el archivo **firestore.rules** que acompaña al juego y pulsá **Publicar**.
4. Abrí el juego actualizado, recargá con **Ctrl + F5** y entrá con tu cuenta de siempre. El correo debe estar verificado.

No necesitás crear colecciones a mano. Aparecen cuando se guarda el primer perfil o se envía una solicitud. No uses el modo de prueba ni reglas de acceso abierto.

## Usarlo

- **Tu cuenta → Personalizar perfil:** foto propia, biografía, estado, pronombres, color, estilo, aura del avatar y hasta seis stickers. El banner se elige desde la misma cuenta.
- **Tab → tarjeta de otro jugador:** añadir amigo y ver su información. Como Owner también aparece **Dar rol Calsito** y, después, **Quitar Calsito**.
- **Amigos:** copiar tu código, añadir por código, aceptar o rechazar solicitudes y abrir conversaciones. Solo amigos que se hayan aceptado pueden intercambiar DM.
- **Bloquear** impide nuevos mensajes y solicitudes. **Amigos → Bloqueados** permite deshacerlo.
- Owner se muestra en blanco y Calsito en amarillo sobre el personaje. La insignia Calsito usa el logo CAL. Un sticker CAL es decorativo y no concede ese rol.

La cuenta del dueño se reconoce con la misma identificación verificada que ya usaba el juego. La clave de editor local no da permiso para conceder roles. Las reglas comprueban estos permisos en Firebase.

## Comprobaciones para desarrollo

El servidor del juego continúa sin dependencias de producción. Las pruebas requieren Chrome, Playwright y, para las reglas, los paquetes de desarrollo Firebase y Java 21.

- `npm run test:perfiles:v2`: editor, contenido inválido, vistas pequeñas, títulos y ahorro de partículas/postprocesado.
- `firebase emulators:start --project demo-calfight-social --only firestore,auth`: base y cuentas de prueba, únicamente en localhost. El CLI oficial se instala aparte.
- Con los emuladores activos: `npm run test:social:reglas` y `npm run test:social`. Estas pruebas usan cuentas ficticias y sustituyen la identificación del dueño solo en el emulador. Nunca escriben en el proyecto real.

Los DM se guardan en Firestore, protegidos por las reglas de acceso. No se publican en MQTT, WebRTC ni en los estados de combate. Los perfiles públicos incluyen un identificador de jugador para la amistad; no incluyen correo, contraseña ni tokens de sesión.

## Rendimiento

El modo Auto reduce calidad tras varias mediciones de FPS bajos. La selección manual se conserva. La calidad baja evita crear el compositor pesado al iniciar, reduce sus buffers si ya estaba creado, compacta las partículas activas y baja la frecuencia de decoración submarina. No cambia daño, física ni frecuencia de red. Los equipos siguen necesitando un navegador con WebGL funcional.

Referencia de permisos de Firebase: https://firebase.google.com/docs/firestore/security/rules-conditions
