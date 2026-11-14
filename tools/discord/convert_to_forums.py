# -*- coding: utf-8 -*-
"""
Convierte los canales de bugs, sugerencias y clips a Foros (type 15) de Discord
y garantiza que la gente común pueda publicar posts, subir clips, arte y reportes.
"""
import sys
import json
import time
import urllib.request
import urllib.error

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

API_BASE = "https://discord.com/api/v10"

def api(endpoint, token, method="GET", data=None):
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
        "User-Agent": "BlockStrikeDiscordSetup/1.0"
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw.decode("utf-8")) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        if e.code == 429:
            try:
                j = json.loads(err)
                wait_t = float(j.get("retry_after", 1.5))
            except Exception:
                wait_t = 2.0
            print(f"  [i] Rate limit de Discord. Esperando {wait_t:.1f}s...")
            time.sleep(wait_t + 0.3)
            return api(endpoint, token, method=method, data=data)
        print(f"[-] Error {method} {endpoint}: {e.code} - {err}")
        return None

def main():
    if len(sys.argv) < 3:
        token = input("Bot Token: ").strip()
        guild_id = input("Guild ID: ").strip()
    else:
        token = sys.argv[1].strip()
        guild_id = sys.argv[2].strip()

    print("=" * 60)
    print("  TRANSFORMANDO CANALES A FORO Y HABILITANDO PERMISOS PÚBLICOS")
    print("=" * 60)

    # 1. Obtener canales actuales
    channels = api(f"/guilds/{guild_id}/channels", token)
    if not channels:
        print("[-] Error obteniendo canales.")
        return

    # Buscar la categoría de comunidad
    cat_comunidad = next((c for c in channels if c.get("type") == 4 and "COMUNIDAD" in c.get("name", "")), None)
    parent_id = cat_comunidad["id"] if cat_comunidad else None

    # Obtener el rol @everyone
    roles = api(f"/guilds/{guild_id}/roles", token)
    everyone_role = next((r for r in roles if r["name"] == "@everyone"), None)
    everyone_id = everyone_role["id"] if everyone_role else guild_id

    # Canales a transformar en FORO
    forums_to_create = [
        {
            "match": ["reporte-de-bugs", "reporte_de_bugs", "bugs"],
            "name": "🐛・reporte-de-bugs",
            "topic": "Reporta fallos, bugs visuales o errores de combate con títulos claros y capturas.",
            "guidelines": "¡Reporta aquí cualquier fallo o bug!\n1. Incluye una descripción clara.\n2. Sube una captura o video si es posible.\n3. Indica qué personaje estabas usando.",
            "tags": [
                {"name": "🔴 Crítico", "moderated": False},
                {"name": "🎮 Combate", "moderated": False},
                {"name": "🎨 Visual / Animación", "moderated": False},
                {"name": "🌐 Multijugador", "moderated": False},
                {"name": "✅ Resuelto", "moderated": True}
            ]
        },
        {
            "match": ["sugerencias", "ideas"],
            "name": "💡・sugerencias",
            "topic": "Propón nuevos personajes, mecánicas de lucha, combos o mejoras para BlockStrike.",
            "guidelines": "¡Comparte tus ideas para el juego!\n- Propón nuevos luchadores o animaciones.\n- Vota con reacciones las sugerencias de otros jugadores.",
            "tags": [
                {"name": "🥊 Nuevo Personaje", "moderated": False},
                {"name": "⚔️ Mecánica de Combate", "moderated": False},
                {"name": "🗺️ Mapa / Escenario", "moderated": False},
                {"name": "✨ Efectos / VFX", "moderated": False}
            ]
        },
        {
            "match": ["clips-y-combos", "clips_y_combos", "clips"],
            "name": "🎬・clips-y-combos",
            "topic": "Sube tus mejores jugadas, combos de 4, K.O.s épicos y remates de torneo.",
            "guidelines": "¡Sube aquí tus clips de combate!\nPuedes adjuntar videos MP4 o enlaces de YouTube, Medal y Twitch.",
            "tags": [
                {"name": "🔥 Combo K.O.", "moderated": False},
                {"name": "🏆 Duelo 1v1", "moderated": False},
                {"name": "🇵🇪 ElRandi", "moderated": False},
                {"name": "🔷 Javicubito", "moderated": False},
                {"name": "🦅 Sekza", "moderated": False},
                {"name": "😂 Momentos Random", "moderated": False}
            ]
        }
    ]

    # Eliminar canales antiguos de texto que se reemplazarán por foro
    for f_info in forums_to_create:
        for ch in channels:
            ch_name = ch.get("name", "")
            if any(m in ch_name for m in f_info["match"]) and ch.get("type") == 0:
                print(f"  [-] Eliminando canal de texto antiguo: {ch_name} (ID: {ch['id']})")
                api(f"/channels/{ch['id']}", token, method="DELETE")
                time.sleep(0.5)

    # 2. Crear los canales tipo FORO (type 15)
    created_forums = []
    for f_info in forums_to_create:
        print(f"\n[+] Creando canal de FORO: {f_info['name']}...")
        forum_data = {
            "name": f_info["name"],
            "type": 15, # GUILD_FORUM
            "topic": f_info["topic"],
            "available_tags": f_info["tags"],
            "default_forum_layout": 1 # 1 = List view, 2 = Gallery view
        }
        if parent_id:
            forum_data["parent_id"] = parent_id

        # Permisos explícitos para @everyone en el foro:
        # Permite ver canal, crear posts públicos, mandar mensajes en posts, adjuntar archivos, enlaces y reacciones
        allow_flags = (
            1024 |          # VIEW_CHANNEL
            65536 |         # READ_MESSAGE_HISTORY
            34359738368 |   # CREATE_PUBLIC_THREADS (crear posts en el foro)
            274877906944 |  # SEND_MESSAGES_IN_THREADS (comentar en posts)
            32768 |         # ATTACH_FILES (subir videos, clips y fotos de bugs)
            16384 |         # EMBED_LINKS (links de videos)
            64              # ADD_REACTIONS (votar y reaccionar)
        )
        forum_data["permission_overwrites"] = [
            {
                "id": everyone_id,
                "type": 0,
                "allow": str(allow_flags),
                "deny": "0"
            }
        ]

        res = api(f"/guilds/{guild_id}/channels", token, method="POST", data=forum_data)
        if res and "id" in res:
            print(f"  [+] ¡Foro creado con éxito! ID: {res['id']}")
            created_forums.append((res["id"], f_info))
        time.sleep(0.6)

    # 3. Asegurar permisos en #arte-y-skins (Canal de texto normal para la comunidad)
    print("\n--- Verificando permisos públicos en #arte-y-skins y canales de comunidad ---")
    channels_updated = api(f"/guilds/{guild_id}/channels", token)
    for ch in (channels_updated or []):
        if "arte" in ch.get("name", "") and ch.get("type") == 0:
            ch_id = ch["id"]
            # Permitir enviar mensajes, archivos (modelos/texturas), enlaces y reacciones
            comm_allow = 1024 | 2048 | 32768 | 16384 | 65536 | 64
            api(f"/channels/{ch_id}/permissions/{everyone_id}", token, method="PUT", data={
                "type": 0,
                "allow": str(comm_allow),
                "deny": "0"
            })
            print(f"  [+] Permisos públicos (subida de archivos e imágenes) asegurados en: {ch['name']}")

    # 4. Crear post fijado inicial en cada foro
    print("\n--- Creando primer post de bienvenida en cada foro ---")
    for f_id, f_info in created_forums:
        thread_data = {
            "name": f"📌 Guía e información sobre {f_info['name']}",
            "message": {
                "content": f_info["guidelines"]
            }
        }
        api(f"/channels/{f_id}/threads", token, method="POST", data=thread_data)
        print(f"  [+] Post fijado creado en {f_info['name']}")
        time.sleep(0.5)

    print("\n" + "=" * 60)
    print("  🎉 ¡FOROS Y PERMISOS PÚBLICOS LISTOS AL 100%! 🎉")
    print("=" * 60)

if __name__ == "__main__":
    main()
