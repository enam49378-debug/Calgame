-- ==============================================================================
-- Instalar_Ciudad_Roblox.luau — Script de Command Bar (1 solo paso, SIN .obj)
-- Borra el mapa viejo de Battlegrounds en Workspace.Map, mueve toda Ciudad Aurora
-- (100% piezas nativas de Roblox) a Workspace.Map, reemplaza los Spawns en
-- Workspace.Miscellaneous.Spawns e instala el ascensor de Torre Aurora.
-- ==============================================================================

local ServerScriptService = game:GetService("ServerScriptService")
local Workspace = game:GetService("Workspace")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local importRoot = Workspace:FindFirstChild("CalFight_Ciudad_Import")
assert(importRoot, "No se encontro Workspace.CalFight_Ciudad_Import. Haz clic derecho en Workspace -> Insert from File... -> CalFight_Ciudad_Roblox.rbxmx primero.")

ChangeHistoryService:SetWaypoint("CalFight_Antes_CambiarMapa")

local mapFolder = Workspace:FindFirstChild("Map")
if not mapFolder then
	mapFolder = Instance.new("Folder")
	mapFolder.Name = "Map"
	mapFolder.Parent = Workspace
end

-- 1. Borrar el mapa anterior del Battlegrounds conservando Throwables y Emote Anims
local keepInMap = { Throwables = true, ["Emote Anims"] = true }
local removed = 0
for _, child in ipairs(mapFolder:GetChildren()) do
	if not keepInMap[child.Name] then
		child:Destroy()
		removed += 1
	end
end

-- 2. Mover todas las carpetas de CalFight dentro de Workspace.Map
local srcMap = importRoot:FindFirstChild("Map")
local movedFolders = 0
if srcMap then
	for _, sub in ipairs(srcMap:GetChildren()) do
		sub.Parent = mapFolder
		movedFolders += 1
	end
end

-- 3. Reemplazar los spawns en Workspace.Miscellaneous.Spawns
local srcSpawns = importRoot:FindFirstChild("Spawns")
local spawnCount = 0
if srcSpawns then
	local misc = Workspace:FindFirstChild("Miscellaneous")
	local dstSpawns = misc and misc:FindFirstChild("Spawns")
	if dstSpawns then
		dstSpawns:ClearAllChildren()
		for _, sp in ipairs(srcSpawns:GetChildren()) do
			sp.Parent = dstSpawns
			spawnCount += 1
		end
		srcSpawns:Destroy()
	else
		spawnCount = #srcSpawns:GetChildren()
		srcSpawns.Parent = Workspace
	end
end

importRoot:Destroy()

-- 4. Instalar o actualizar AscensorTorreAurora en ServerScriptService
local elev = ServerScriptService:FindFirstChild("AscensorTorreAurora")
if elev then elev:Destroy() end
local scr = Instance.new("Script")
scr.Name = "AscensorTorreAurora"
local okSrc = pcall(function()
	scr.Source = [[-- ==============================================================================
-- AscensorTorreAurora — Script de Servidor (ServerScriptService)
-- Activa las plataformas cian de Torre Aurora para subir a la azotea y bajar.
-- ==============================================================================

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local mapFolder = Workspace:FindFirstChild("Map")
local folder = mapFolder and mapFolder:FindFirstChild("Ascensores")
if not folder then
	warn("[AscensorTorreAurora] No se encontro Workspace.Map.Ascensores")
	return
end

local padSubir = folder:FindFirstChild("TorreAurora_Subir")
local padBajar = folder:FindFirstChild("TorreAurora_Bajar")
if not (padSubir and padBajar) then
	warn("[AscensorTorreAurora] Faltan TorreAurora_Subir o TorreAurora_Bajar")
	return
end

local cooldown = {}

local function connectPad(srcPad, dstPad)
	srcPad.Touched:Connect(function(hit)
		local char = hit.Parent
		if not char then return end
		local hum = char:FindFirstChildOfClass("Humanoid")
		local root = char:FindFirstChild("HumanoidRootPart")
		if not (hum and root and hum.Health > 0) then return end

		local plr = Players:GetPlayerFromCharacter(char)
		local key = plr or char
		local now = os.clock()
		if cooldown[key] and now - cooldown[key] < 2.2 then return end
		cooldown[key] = now

		root.CFrame = dstPad.CFrame + Vector3.new(0, 4.5, 0)
	end)
end

connectPad(padSubir, padBajar)
connectPad(padBajar, padSubir)
print("[CalFight] Ascensor de Torre Aurora activo.")
]]
end)
scr.Parent = ServerScriptService

ChangeHistoryService:SetWaypoint("CalFight_MapaInstalado")
print(string.format("[CalFight] LISTO! Borrados %d objetos del mapa anterior | Movidas %d carpetas a Workspace.Map | %d Spawns instalados | Ascensor=%s", removed, movedFolders, spawnCount, tostring(okSrc)))
