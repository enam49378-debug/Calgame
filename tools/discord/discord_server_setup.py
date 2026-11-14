# -*- coding: utf-8 -*-
"""
BlockStrike / CalFight - Creador y Configurador Automático de Servidor de Discord
Usa la API REST directa de Discord v10 (no requiere instalar librerías externas).
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

def discord_request(endpoint, method="GET", data=None, token="", retries=3):
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
        "User-Agent": "BlockStrikeDiscordSetup/1.0"
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                res_body = resp.read()
                return json.loads(res_body.decode("utf-8")) if res_body else {}
        except urllib.error.HTTPError as e:
            raw_err = e.read().decode("utf-8")
            if e.code == 429:
                try:
                    j = json.loads(raw_err)
                    wait_sec = float(j.get("retry_after", 1.5))
                except Exception:
                    wait_sec = 2.0
                print(f"  [i] Rate limit de Discord. Esperando {wait_sec:.1f}s...")
                time.sleep(wait_sec + 0.3)
                continue
            print(f"[-] Error en {method} {endpoint}: {e.code} - {raw_err}")
            return None
        except Exception as e:
            print(f"[-] Error de conexión: {e}")
            if attempt < retries - 1:
                time.sleep(1.0)
                continue
            return None
    return None

def create_role(guild_id, name, color_hex, hoist=True, mentionable=False, token=""):
    col_int = int(color_hex.replace("#", ""), 16)
    data = {
        "name": name,
        "color": col_int,
        "hoist": hoist,
        "mentionable": mentionable
    }
    res = discord_request(f"/guilds/{guild_id}/roles", method="POST", data=data, token=token)
    if res and "id" in res:
        print(f"  [+] Rol creado: {name} ({color_hex})")
        return res["id"]
    return None

def create_channel(guild_id, name, ch_type=0, parent_id=None, topic="", token=""):
    # ch_type: 0 = text, 2 = voice, 4 = category
    data = {
        "name": name,
        "type": ch_type
    }
    if parent_id:
        data["parent_id"] = parent_id
    if topic and ch_type == 0:
        data["topic"] = topic

    res = discord_request(f"/guilds/{guild_id}/channels", method="POST", data=data, token=token)
    if res and "id" in res:
        type_str = "Categoría" if ch_type == 4 else ("Voz" if ch_type == 2 else "Texto")
        print(f"  [+] Canal ({type_str}) creado: {name}")
        return res["id"]
    return None

def send_embed(channel_id, title, description, color_hex, fields=None, token=""):
    col_int = int(color_hex.replace("#", ""), 16)
    embed = {
        "title": title,
        "description": description,
        "color": col_int,
        "footer": {"text": "BlockStrike · CalFight Arena Oficial"}
    }
    if fields:
        embed["fields"] = fields
    data = {"embeds": [embed]}
    return discord_request(f"/channels/{channel_id}/messages", method="POST", data=data, token=token)

def build_server(guild_id, token):
    print("=" * 60)
    print("  🚀 INICIANDO CONFIGURACIÓN DEL SERVIDOR BLOCKSTRIKE / CALFIGHT")
    print("=" * 60)

    # 1. Verificar datos del servidor
    guild = discord_request(f"/guilds/{guild_id}", token=token)
    if not guild or "name" not in guild:
        print("[-] No se pudo acceder al servidor. Revisa que el bot haya sido invitado con permisos de Administrador.")
        return False

    print(f"[+] Servidor detectado: {guild.get('name')} (ID: {guild_id})")

    # 2. Creación de Roles
    print("\n--- [1/3] Creando Jerarquía de Roles ---")
    roles = [
        ("👑 Creador / Dev", "#FFD700", True),
        ("🛡️ Moderador", "#00E5FF", True),
        ("⚔️ Campeón CalFight", "#FF1744", True),
        ("🔥 Veterano de Combate", "#FF9100", True),
        ("🎮 Peleador Cúbico", "#76FF03", True),
        ("🤖 Bot", "#B0BEC5", False)
    ]
    created_roles = {}
    for name, color, hoist in roles:
        r_id = create_role(guild_id, name, color, hoist=hoist, token=token)
        if r_id:
            created_roles[name] = r_id
        time.sleep(0.4)

    # 3. Creación de Categorías y Canales
    print("\n--- [2/3] Creando Categorías y Canales ---")
    
    # Categoría 1: Información & Reglas
    cat_info = create_channel(guild_id, "📢 │ INFORMACIÓN & REGLAS", ch_type=4, token=token)
    time.sleep(0.5)
    ch_reglas = create_channel(guild_id, "📜・reglas", ch_type=0, parent_id=cat_info, topic="Normas y reglas de convivencia en BlockStrike", token=token)
    time.sleep(0.4)
    ch_anuncios = create_channel(guild_id, "📢・anuncios", ch_type=0, parent_id=cat_info, topic="Noticias y avisos oficiales de los desarrolladores", token=token)
    time.sleep(0.4)
    ch_parches = create_channel(guild_id, "🔄・actualizaciones", ch_type=0, parent_id=cat_info, topic="Changelogs y mejoras del juego", token=token)
    time.sleep(0.4)
    ch_guia = create_channel(guild_id, "📖・guia-y-controles", ch_type=0, parent_id=cat_info, topic="Controles, combos y guía de juego", token=token)
    time.sleep(0.4)
    ch_lore = create_channel(guild_id, "👥・personajes", ch_type=0, parent_id=cat_info, topic="Información de personajes y habilidades", token=token)
    time.sleep(0.5)

    # Categoría 2: Comunidad
    cat_comunidad = create_channel(guild_id, "💬 │ COMUNIDAD CALFIGHT", ch_type=4, token=token)
    time.sleep(0.5)
    ch_general = create_channel(guild_id, "💬・general", ch_type=0, parent_id=cat_comunidad, topic="Charla general de la comunidad", token=token)
    time.sleep(0.4)
    ch_match = create_channel(guild_id, "⚔️・buscar-partida", ch_type=0, parent_id=cat_comunidad, topic="¡Comparte tu link de sala y busca rivales!", token=token)
    time.sleep(0.4)
    ch_clips = create_channel(guild_id, "🎬・clips-y-combos", ch_type=0, parent_id=cat_comunidad, topic="Tus mejores combos, K.O.s y jugadas épicas", token=token)
    time.sleep(0.4)
    ch_sug = create_channel(guild_id, "💡・sugerencias", ch_type=0, parent_id=cat_comunidad, topic="Ideas de personajes, ataques o mapas", token=token)
    time.sleep(0.4)
    ch_bugs = create_channel(guild_id, "🐛・reporte-de-bugs", ch_type=0, parent_id=cat_comunidad, topic="Reporta fallos o errores para que los arreglemos", token=token)
    time.sleep(0.4)
    ch_art = create_channel(guild_id, "🎨・arte-y-skins", ch_type=0, parent_id=cat_comunidad, topic="Modelos de Blockbench, texturas y skins custom", token=token)
    time.sleep(0.5)

    # Categoría 3: Canales de Voz
    cat_voz = create_channel(guild_id, "🔊 │ CANALES DE VOZ", ch_type=4, token=token)
    time.sleep(0.5)
    create_channel(guild_id, "🔊・Lobby Principal", ch_type=2, parent_id=cat_voz, token=token)
    time.sleep(0.4)
    create_channel(guild_id, "⚔️・Duelo 1v1 [Arena A]", ch_type=2, parent_id=cat_voz, token=token)
    time.sleep(0.4)
    create_channel(guild_id, "⚔️・Duelo 1v1 [Arena B]", ch_type=2, parent_id=cat_voz, token=token)
    time.sleep(0.4)
    create_channel(guild_id, "🏆・Torneo / Espectadores", ch_type=2, parent_id=cat_voz, token=token)
    time.sleep(0.5)

    # 4. Enviar Mensajes de Presentación
    print("\n--- [3/3] Publicando Guías y Mensajes Oficiales ---")

    # Mensaje en #reglas
    if ch_reglas:
        send_embed(
            ch_reglas,
            title="📜 REGLAS OFICIALES DE BLOCKSTRIKE / CALFIGHT",
            description=(
                "¡Bienvenido a la arena! Para mantener el torneo en orden y divertido para todos, respeta las siguientes reglas:\n\n"
                "**1. Respeto Mutuo:** Prohibido el acoso, insultos tóxicos o discursos de odio.\n"
                "**2. Juego Limpio:** Prohibido el uso de hacks, scripts no autorizados o exploits del juego.\n"
                "**3. No Spam:** Mantén los mensajes y links de sala en sus canales correspondientes (`#buscar-partida`).\n"
                "**4. Contenido Adecuado:** No compartas contenido NSFW, gore o peligroso.\n"
                "**5. Decisión del Staff:** Respeta las indicaciones de moderadores y desarrolladores.\n\n"
                "*¡Diviértete y demuestra tu habilidad en la arena!*"
            ),
            color_hex="#FFD700",
            token=token
        )
        print("  [+] Embed de Reglas enviado a #reglas")
        time.sleep(0.4)

    # Mensaje en #guia-y-controles
    if ch_guia:
        controles_fields = [
            {"name": "🏃 Movimiento", "value": "`W` `A` `S` `D` : Desplazarse por la arena\n`ESPACIO` : Saltar\n`Q` : Esquive / Dash direccional con iframes", "inline": False},
            {"name": "⚔️ Combate Básico", "value": "`CLIC IZQUIERDO` : Combo básico de 4 golpes (M1)\n`CLIC + ESPACIO` : Remate aéreo uppercut\n`F` : Bloqueo (¡Cuidado con los rompeguardias!)", "inline": False},
            {"name": "💥 Habilidades y Despertar", "value": "`1` `2` `3` `4` : Habilidades especiales del personaje\n`G` : **DESPERTAR (Ulti)** al llegar a 100% de energía\n`F2` : Alternar contador de FPS", "inline": False}
        ]
        send_embed(
            ch_guia,
            title="📖 GUÍA DE COMBATE Y CONTROLES",
            description="Aprende los movimientos esenciales para dominar el sistema de combate estilo anime de BlockStrike.",
            color_hex="#00E5FF",
            fields=controles_fields,
            token=token
        )
        print("  [+] Embed de Guía enviado a #guia-y-controles")
        time.sleep(0.4)

    # Mensaje en #personajes
    if ch_lore:
        pj_fields = [
            {"name": "🇵🇪 ElRandi · Invocador del Perú", "value": "Maestro de las sombras y picoteos. Sus palomas marcan al rival, corre trazando líneas de Nazca y se chispea con pisco sour. Al despertar gana el Cóndor y llama a Capitán Perú.", "inline": False},
            {"name": "🔷 Javicubito · Lancero Cúbico", "value": "Guerrero táctico armado con su lanza de Minecraft a la espalda. Estocadas de largo alcance, embestida veloz y arroja su lanza que regresa a su mano.", "inline": False},
            {"name": "🦅 Sekza · Garra del Cielo", "value": "Luchador aéreo feroz: zarpazos veloces, plumas teledirigidas y picadas rasantes. Al despertar despliega sus alas y desata una tormenta de plumas.", "inline": False}
        ]
        send_embed(
            ch_lore,
            title="👥 ROSTER DE LUCHADORES",
            description="Conoce a los personajes principales y sus estilos únicos de pelea en Ciudad Aurora.",
            color_hex="#FF1744",
            fields=pj_fields,
            token=token
        )
        print("  [+] Embed de Personajes enviado a #personajes")

    print("\n" + "=" * 60)
    print("  🎉 ¡SERVIDOR CONFIGURADO CON ÉXITO AL 100%! 🎉")
    print("  Canales, roles, categorías y guías listos para tu comunidad.")
    print("=" * 60)
    return True

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        tok = sys.argv[1].strip()
        gid = sys.argv[2].strip()
    else:
        print("--- Creador de Servidor de Discord para BlockStrike / CalFight ---")
        tok = input("Introduce el Token del Bot de Discord: ").strip()
        gid = input("Introduce el ID del Servidor (Server ID): ").strip()

    if not tok or not gid:
        print("[-] Error: Faltan el Token o el ID del servidor.")
        sys.exit(1)

    success = build_server(gid, tok)
    sys.exit(0 if success else 1)
