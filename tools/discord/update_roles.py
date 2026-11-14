# -*- coding: utf-8 -*-
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
        token = input("Bot Token: ").strip()
        guild_id = input("Guild ID: ").strip()
    else:
        token = sys.argv[1].strip()
        guild_id = sys.argv[2].strip()

    print("=" * 60)
    print("  ACTUALIZANDO ROLES DEL SERVIDOR CALFIGHT")
    print("=" * 60)

    new_roles = [
        {"name": "Owner", "color": 0xFFD700, "hoist": True, "mentionable": True},
        {"name": "Developers", "color": 0x00E5FF, "hoist": True, "mentionable": True},
        {"name": "Calsitos", "color": 0xFF007F, "hoist": True, "mentionable": True},
        {"name": "Tester", "color": 0x76FF03, "hoist": True, "mentionable": True},
        {"name": "Jugador Promedio 🗣🔥", "color": 0xFF6D00, "hoist": True, "mentionable": False}
    ]

    for r in reversed(new_roles):
        res = api(f"/guilds/{guild_id}/roles", token, method="POST", data=r)
        if res and "id" in res:
            print(f"  [+] Rol creado: {r['name']} (#{r['color']:06X})")
        time.sleep(0.5)

if __name__ == "__main__":
    main()
