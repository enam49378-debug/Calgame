-- Cliente de CalFight sincronizado via Rojo
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("CalFight"):WaitForChild("CiudadConfig"))

print("[CalFight Rojo Client] Listo en " .. Config.CITY_NAME)
