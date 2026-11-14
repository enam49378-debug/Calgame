# -*- coding: utf-8 -*-
"""
Configura los permisos exactos y profesionales para cada rol y canal en el servidor de Discord.
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
            print(f"  [i] Rate limit. Esperando {wait_t:.1f}s...")
            time.sleep(wait_t + 0.3)
            return api(endpoint, token, method=method, data=data)
        print(f"[-] Error {method} {endpoint}: {e.code} - {err}")
        return None

def main():
    if len(sys.argv) < 3:
        token = input("Token: ").strip()
        guild_id = input("Guild ID: ").strip()
    else:
        token = sys.argv[1].strip()
        guild_id = sys.argv[2].strip()

    print("=" * 60)
    print("  CONFIGURANDO PERMISOS DE ROLES Y CANALES EN CALFIGHT")
    print("=" * 60)

    # 1. Obtener roles actuales
    roles = api(f"/guilds/{guild_id}/roles", token)
    if not roles:
        print("[-] Error obteniendo roles.")
        return

    roles_map = {r["name"]: r for r in roles}
    everyone_role = roles_map.get("@everyone")

    # Definición de permisos por rol
    # Discord Bitwise Flags:
    # ADMINISTRATOR: 8
    # VIEW_CHANNEL: 1024
    # SEND_MESSAGES: 2048
    # EMBED_LINKS: 16384
    # ATTACH_FILES: 32768
    # READ_MESSAGE_HISTORY: 65536
    # USE_EXTERNAL_EMOJIS: 262144
    # CONNECT: 1048576
    # SPEAK: 2097152
    # STREAM: 512
    # PRIORITY_SPEAKER: 256
    # ADD_REACTIONS: 64
    # USE_APPLICATION_COMMANDS: 2147483648
    # USE_VAD: 33554432
    # CHANGE_NICKNAME: 67108864
    # USE_EXTERNAL_STICKERS: 137438953472
    # MANAGE_CHANNELS: 16
    # MANAGE_MESSAGES: 8192
    # MANAGE_WEBHOOKS: 536870912

    ROLE_PERMS = {
        # 1. Owner: ADMINISTRADOR TOTAL
        "Owner": str(8),

        # 2. Developers: ADMINISTRADOR TÉCNICO (para configurar bots, webhooks y canales)
        "Developers": str(8),

        # 3. Calsitos: VIP para los animadores / creadores de personajes
        # (Transmitir en vivo, Prioridad de voz en salas, emojis/stickers externos, adjuntar archivos y cambiar apodo)
        "Calsitos": str(1024 | 2048 | 16384 | 32768 | 65536 | 262144 | 1048576 | 2097152 | 512 | 256 | 64 | 2147483648 | 33554432 | 67108864 | 137438953472),

        # 4. Tester: Probadores de juego
        # (Transmitir pantalla para mostrar bugs, subir clips/archivos, enlaces y comandos)
        "Tester": str(1024 | 2048 | 16384 | 32768 | 65536 | 1048576 | 2097152 | 512 | 64 | 2147483648 | 33554432),

        # 5. Jugador Promedio 🗣🔥: Miembros generales
        # (Hablar, chatear, conectar a voz, usar comandos y enviar imágenes en canales de chat)
        "Jugador Promedio 🗣🔥": str(1024 | 2048 | 16384 | 32768 | 65536 | 64 | 1048576 | 2097152 | 33554432 | 2147483648)
    }

    print("\n--- [1/2] Aplicando Permisos a los Roles ---")
    for r_name, p_str in ROLE_PERMS.items():
        if r_name in roles_map:
            r = roles_map[r_name]
            res = api(f"/guilds/{guild_id}/roles/{r['id']}", token, method="PATCH", data={"permissions": p_str})
            if res:
                perm_desc = "Administrador Total" if p_str == "8" else "Permisos Especializados"
                print(f"  [+] {r_name}: {perm_desc} asignado.")
            time.sleep(0.4)

    # 2. Proteger los Canales Informativos (Solo lectura para @everyone y Jugador Promedio)
    print("\n--- [2/2] Protegiendo Canales Informativos contra Spam ---")
    channels = api(f"/guilds/{guild_id}/channels", token)
    if channels and everyone_role:
        for ch in channels:
            # Los canales de reglas, anuncios, parches, guías y personajes solo deben permitir lectura a miembros normales
            if ch.get("name") in ["📜・reglas", "📢・anuncios", "🔄・actualizaciones", "📖・guia-y-controles", "👥・personajes", "📢 │ INFORMACIÓN & REGLAS"]:
                ch_id = ch["id"]
                # Denegar SEND_MESSAGES (2048), CREATE_PUBLIC_THREADS (34359738368), CREATE_PRIVATE_THREADS (68719476736)
                # Permitir VIEW_CHANNEL (1024), READ_MESSAGE_HISTORY (65536), ADD_REACTIONS (64)
                deny_flags = str(2048 | 34359738368 | 68719476736)
                allow_flags = str(1024 | 65536 | 64)

                overwrite_url = f"/channels/{ch_id}/permissions/{everyone_role['id']}"
                overwrite_data = {
                    "type": 0, # role
                    "allow": allow_flags,
                    "deny": deny_flags
                }
                api(overwrite_url, token, method="PUT", data=overwrite_data)
                print(f"  [+] Canal '{ch.get('name')}' bloqueado para solo-lectura y reacciones del público.")
                time.sleep(0.4)

    print("\n" + "=" * 60)
    print("  ¡PERMISOS Y PROTECCIONES CONFIGURADOS AL 100%!")
    print("=" * 60)

if __name__ == "__main__":
    main()
