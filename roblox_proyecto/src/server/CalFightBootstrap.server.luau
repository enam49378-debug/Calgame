-- Bootstrap servidor de CalFight sincronizado via Rojo
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage:WaitForChild("CalFight"):WaitForChild("CiudadConfig"))

print(string.format("[CalFight Rojo] Conectado al proyecto '%s' (escala %.2f studs)", Config.CITY_NAME, Config.SCALE))

-- Si el script suelto AscensorTorreAurora no fue creado por el instalador, este modulo activa las plataformas y cabinas igualmente
if not ServerScriptService:FindFirstChild("AscensorTorreAurora") then
	local mapFolder = Workspace:FindFirstChild("Map")
	local folder = mapFolder and mapFolder:FindFirstChild("Ascensores")
	if folder then
		local Players = game:GetService("Players")
		local cooldown = {}

		local function getPads(prefix)
			local list = {}
			for _, child in ipairs(folder:GetChildren()) do
				if child:IsA("BasePart") and (child.Name == prefix or child.Name:sub(1, #prefix + 1) == prefix .. "_") then
					table.insert(list, child)
				end
			end
			return list
		end

		local subirPads = getPads("TorreAurora_Subir")
		local bajarPads = getPads("TorreAurora_Bajar")
		local defaultBajar = folder:FindFirstChild("TorreAurora_Bajar") or bajarPads[1]
		local defaultSubir = folder:FindFirstChild("TorreAurora_Subir") or subirPads[1]

		local function teleportChar(char, dstPad, forwardOffset)
			local hum = char and char:FindFirstChildOfClass("Humanoid")
			local root = char and char:FindFirstChild("HumanoidRootPart")
			if not (hum and root and hum.Health > 0 and dstPad) then return end
			local plr = Players:GetPlayerFromCharacter(char)
			local key = plr or char
			local now = os.clock()
			if cooldown[key] and now - cooldown[key] < 2.0 then return end
			cooldown[key] = now
			local destCf = dstPad.CFrame * CFrame.new(0, 3.8, forwardOffset or 0)
			root.AssemblyLinearVelocity = Vector3.zero
			root.CFrame = destCf
		end

		local function wirePad(srcPad, dstPad, actionText, forwardOffset)
			if not (srcPad and dstPad) then return end
			srcPad.Touched:Connect(function(hit)
				if hit and hit.Parent then
					teleportChar(hit.Parent, dstPad, forwardOffset)
				end
			end)
			local prompt = srcPad:FindFirstChildOfClass("ProximityPrompt")
			if not prompt then
				prompt = Instance.new("ProximityPrompt")
				prompt.ObjectText = "Ascensor Torre Aurora"
				prompt.ActionText = actionText
				prompt.KeyboardKeyCode = Enum.KeyCode.E
				prompt.HoldDuration = 0
				prompt.MaxActivationDistance = 12
				prompt.RequiresLineOfSight = false
				prompt.Parent = srcPad
			end
			prompt.Triggered:Connect(function(player)
				if player.Character then
					teleportChar(player.Character, dstPad, forwardOffset)
				end
			end)
		end

		if defaultBajar then
			for _, p in ipairs(subirPads) do
				wirePad(p, defaultBajar, "Subir a la Azotea", -5.5)
			end
		end
		if defaultSubir then
			for _, p in ipairs(bajarPads) do
				wirePad(p, defaultSubir, "Bajar al Vestibulo", 4.5)
			end
		end
		print(string.format("[CalFight Ascensor] Conectado: %d subida(s) <-> %d bajada(s)", #subirPads, #bajarPads))
	end
end
