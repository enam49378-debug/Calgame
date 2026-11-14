# Seguridad de las cuentas

CalFight usa **Firebase Authentication** (correo y contraseña, o Google) y **Firestore** para perfiles, amigos y mensajes. Nunca se guardan contraseñas en el juego: las maneja Firebase.

## Qué hace el juego (ya está en el código)
- **Contraseña fuerte al crear la cuenta:** mínimo 8 caracteres, con letras y números, sin contraseñas comunes (`12345678`, `password`…) y sin tu correo adentro.
- **Freno a los intentos fallidos:** tras 5 contraseñas incorrectas en 10 minutos el juego espera 15 s, 30 s, 60 s… hasta 5 min antes de volver a probar (además del límite de Firebase).
- **Mensaje igual para «correo no existe» y «contraseña mala»**, así nadie puede averiguar qué correos tienen cuenta.
- **«Recordarme en este equipo»:** si lo desmarcás (PC compartida) la sesión se cierra al cerrar la pestaña.
- **Cambiar contraseña** desde el panel de la cuenta (te llega un correo a tu dirección).
- **Verificación de correo obligatoria** para amigos, mensajes, perfil público y salas públicas.
- **Reglas de Firestore** (`firestore.rules`): cada uno solo puede escribir su propio perfil, validado campo por campo (tamaños, formatos, imágenes); los mensajes solo los leen los amigos y nadie puede editarlos ni borrarlos; los bloqueos se respetan; buscar perfiles pide cuenta verificada; todo lo demás está prohibido.
- **Datos mínimos:** el perfil público no incluye tu correo. Solo tu nombre, avatar y lo que elijas mostrar.
- **CSP** (política de contenido): el juego solo carga scripts de sitios conocidos, con **SRI** (hash) en los de Firebase, y solo se conecta a Firebase/Google y a los relés del juego. No se puede meter el juego en otra página (anti-clickjacking).
- Los textos de otros jugadores (nombres, mensajes, perfiles) se muestran como texto, nunca como HTML.

## Lo que tenés que hacer vos en la consola de Firebase / Google Cloud (no se puede desde el código)
1. **Publicar las reglas:** `firebase deploy --only firestore:rules` (o pegá `firestore.rules` en Firestore → Reglas → Publicar).
2. **Restringir la API key por sitio web:** Google Cloud Console → APIs y servicios → Credenciales → tu clave de navegador → «Restricciones de aplicaciones: Sitios web» → agregá `https://enam49378-debug.github.io/*`. (La clave del juego es pública por diseño, pero así nadie más puede usarla.)
3. **Authentication → Configuración → Protección contra enumeración de correos:** activada.
4. **Authentication → Configuración → Política de contraseñas:** mínimo 8, exigir mayúscula/minúscula/número.
5. **Authentication → Dominios autorizados:** deja solo `enam49378-debug.github.io` (y `localhost` si desarrollás).
6. **App Check** (reCAPTCHA Enterprise) en Firestore y Authentication, en modo «Aplicar», cuando quieras bloquear bots.
7. **Activá la verificación en dos pasos (2FA) en TU cuenta de Google/Firebase** y en tu cuenta de GitHub. Sin eso, quien tome tu cuenta toma el juego.
8. Cuotas y alertas de presupuesto en Google Cloud para que un abuso no te cueste dinero.

## Para jugadores
- Usá una contraseña única para CalFight (no la misma del correo).
- Si te llega un correo de «cambiar contraseña» que no pediste, ignoralo.
- Nadie del juego te va a pedir tu contraseña.
