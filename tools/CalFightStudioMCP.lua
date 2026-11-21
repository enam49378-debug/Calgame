--[[
  CalFightStudioMCP.lua — Plugin local de Roblox Studio para el puente MCP con Antigravity
  Se comunica con http://127.0.0.1:28945 (tools/roblox_studio_mcp.cjs).
]]

local RunService = game:GetService("RunService")
if not RunService:IsEdit() then
	return
end

local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local LogService = game:GetService("LogService")
local ServerStorage = game:GetService("ServerStorage")

local BASE_URL = "http://127.0.0.1:28945"

local toolbar = plugin:CreateToolbar("CalFight MCP")
local toggleBtn = toolbar:CreateButton(
	"CalFightMCP_Toggle",
	"Conectar/Pausar puente MCP con Antigravity (127.0.0.1:28945)",
	"rbxasset://textures/StudioToolbox/AssetPreview/more_dark.png",
	"CalFight MCP"
)

local active = true
toggleBtn:SetActive(active)

local unloaded = false
local logBuffer = {}
local MAX_LOGS = 200

local function pushLog(msg, msgType)
	table.insert(logBuffer, {
		t = os.date("%H:%M:%S"),
		type = tostring(msgType):gsub("^Enum%.MessageType%.", ""),
		msg = tostring(msg),
	})
	if #logBuffer > MAX_LOGS then
		table.remove(logBuffer, 1)
	end
end

local logConn = LogService.MessageOut:Connect(function(msg, msgType)
	pushLog(msg, msgType)
end)

-- Resolver rutas estilo "Workspace.Map.Trees" o "game"
local function resolvePath(pathStr)
	if not pathStr or pathStr == "" or pathStr == "game" then
		return game
	end
	local cur = game
	for seg in string.gmatch(pathStr, "[^%.]+") do
		if seg ~= "game" then
			local ok, svc = pcall(function()
				if cur == game then
					return game:GetService(seg)
				end
				return nil
			end)
			if ok and svc then
				cur = svc
			else
				local nxt = cur:FindFirstChild(seg)
				if not nxt then
					return nil, "No se encontro '" .. seg .. "' dentro de " .. cur:GetFullName()
				end
				cur = nxt
			end
		end
	end
	return cur
end

local function makeFolderPath(pathStr)
	local cur = game
	for seg in string.gmatch(pathStr, "[^%.]+") do
		if seg ~= "game" then
			local nxt = nil
			if cur == game then
				local ok, svc = pcall(function()
					return game:GetService(seg)
				end)
				if ok and svc then nxt = svc end
			end
			if not nxt then
				nxt = cur:FindFirstChild(seg)
			end
			if not nxt then
				local f = Instance.new("Folder")
				f.Name = seg
				f.Parent = cur
				nxt = f
			end
			cur = nxt
		end
	end
	return cur
end

local function serializeValue(v)
	local t = typeof(v)
	if t == "Vector3" then
		return { tonumber(string.format("%.4f", v.X)), tonumber(string.format("%.4f", v.Y)), tonumber(string.format("%.4f", v.Z)) }
	elseif t == "CFrame" then
		return { v:GetComponents() }
	elseif t == "Color3" then
		return string.format("#%02x%02x%02x", math.round(v.R * 255), math.round(v.G * 255), math.round(v.B * 255))
	elseif t == "EnumItem" then
		return tostring(v)
	elseif t == "Instance" then
		return v:GetFullName()
	elseif t == "number" or t == "boolean" or t == "string" then
		return v
	end
	return tostring(v)
end

local handlers = {}

function handlers.get_tree(params)
	local root, err = resolvePath(params.path or "game")
	if not root then error(err) end
	local maxDepth = math.clamp(tonumber(params.depth) or 2, 1, 5)
	local maxLimit = math.clamp(tonumber(params.limit) or 120, 1, 500)

	local function buildNode(inst, d)
		local children = inst:GetChildren()
		local node = {
			name = inst == game and "game" or inst.Name,
			className = inst.ClassName,
			childCount = #children,
		}
		if d < maxDepth and #children > 0 then
			node.children = {}
			local n = math.min(#children, maxLimit)
			for i = 1, n do
				table.insert(node.children, buildNode(children[i], d + 1))
			end
			if #children > n then
				node.truncated = #children - n
			end
		end
		return node
	end

	return buildNode(root, 0)
end

function handlers.find_instances(params)
	local root, err = resolvePath(params.rootPath or "game")
	if not root then error(err) end
	local needle = params.nameContains and string.lower(params.nameContains) or nil
	local cls = params.className
	local limit = math.clamp(tonumber(params.limit) or 80, 1, 300)

	local out = {}
	for _, desc in ipairs(root:GetDescendants()) do
		local ok = true
		if needle and not string.find(string.lower(desc.Name), needle, 1, true) then
			ok = false
		end
		if ok and cls and desc.ClassName ~= cls and not desc:IsA(cls) then
			ok = false
		end
		if ok then
			table.insert(out, {
				name = desc.Name,
				className = desc.ClassName,
				path = desc:GetFullName(),
			})
			if #out >= limit then break end
		end
	end
	return { count = #out, matches = out }
end

function handlers.read_script(params)
	local inst, err = resolvePath(params.path)
	if not inst then error(err) end
	if not inst:IsA("LuaSourceContainer") then
		error(inst:GetFullName() .. " no es un Script/LocalScript/ModuleScript (" .. inst.ClassName .. ")")
	end
	local src = inst.Source
	local lines = string.split(src, "\n")
	local s = math.max(1, tonumber(params.startLine) or 1)
	local e = math.min(#lines, tonumber(params.endLine) or #lines)
	local slice = {}
	for i = s, e do
		table.insert(slice, string.format("%d: %s", i, lines[i]))
	end
	return {
		path = inst:GetFullName(),
		className = inst.ClassName,
		totalLines = #lines,
		startLine = s,
		endLine = e,
		content = table.concat(slice, "\n"),
	}
end

function handlers.write_script(params)
	local parent = makeFolderPath(params.parentPath)
	local cls = params.className or "ModuleScript"
	if cls ~= "Script" and cls ~= "LocalScript" and cls ~= "ModuleScript" then
		error("className invalido: " .. tostring(cls))
	end

	ChangeHistoryService:SetWaypoint("MCP_Before_WriteScript_" .. tostring(params.name))
	local inst = parent:FindFirstChild(params.name)
	local created = false
	if inst and inst.ClassName ~= cls then
		inst:Destroy()
		inst = nil
	end
	if not inst then
		inst = Instance.new(cls)
		inst.Name = params.name
		created = true
	end
	inst.Source = tostring(params.source or "")
	if params.disabled ~= nil and inst:IsA("BaseScript") then
		pcall(function() inst.Enabled = not params.disabled end)
	end
	inst.Parent = parent
	ChangeHistoryService:SetWaypoint("MCP_After_WriteScript_" .. tostring(params.name))

	return {
		created = created,
		path = inst:GetFullName(),
		className = inst.ClassName,
		bytes = #inst.Source,
	}
end

function handlers.get_properties(params)
	local inst, err = resolvePath(params.path)
	if not inst then error(err) end
	local props = {
		Name = inst.Name,
		ClassName = inst.ClassName,
		Path = inst:GetFullName(),
		ChildCount = #inst:GetChildren(),
	}
	local keys = {
		"Anchored", "CanCollide", "CanQuery", "CanTouch", "CastShadow",
		"Transparency", "Reflectance", "Material", "Color", "Position",
		"Size", "CFrame", "Shape", "Enabled", "Disabled", "Duration",
		"MeshId", "TextureID", "Text", "Value", "RunContext",
	}
	for _, k in ipairs(keys) do
		local ok, val = pcall(function() return (inst :: any)[k] end)
		if ok and val ~= nil then
			props[k] = serializeValue(val)
		end
	end
	local attrs = inst:GetAttributes()
	if next(attrs) ~= nil then
		local sa = {}
		for k, v in pairs(attrs) do sa[k] = serializeValue(v) end
		props.Attributes = sa
	end
	if inst:IsA("LuaSourceContainer") then
		props.SourceLength = #inst.Source
	end
	return props
end

function handlers.run_luau(params)
	local code = tostring(params.code or "")
	local wp = tostring(params.waypointName or "MCP_RunLuau")
	ChangeHistoryService:SetWaypoint(wp .. "_Before")

	local printed = {}
	local okExec, resVal

	-- Intentamos loadstring primero; si esta restringido o falla sintaxis moderna, usamos ModuleScript temporal
	local fn = nil
	if typeof(loadstring) == "function" then
		local lfn, lerr = loadstring(code)
		if lfn then fn = lfn else pushLog("[MCP loadstring fallback] " .. tostring(lerr), Enum.MessageType.MessageInfo) end
	end

	if fn then
		local env = setmetatable({
			print = function(...)
				local t = {}
				for i = 1, select("#", ...) do t[i] = tostring(select(i, ...)) end
				local line = table.concat(t, "\t")
				table.insert(printed, line)
				print(line)
			end,
			warn = function(...)
				local t = {}
				for i = 1, select("#", ...) do t[i] = tostring(select(i, ...)) end
				local line = table.concat(t, "\t")
				table.insert(printed, "WARN: " .. line)
				warn(line)
			end,
		}, { __index = getfenv(0) })
		setfenv(fn, env)
		okExec, resVal = pcall(fn)
	else
		local tmp = Instance.new("ModuleScript")
		tmp.Name = "_MCP_Exec_" .. HttpService:GenerateGUID(false):sub(1, 8)
		tmp.Source = "return function()\n" .. code .. "\nend"
		tmp.Parent = ServerStorage
		local okReq, loadedFn = pcall(require, tmp)
		tmp:Destroy()
		if not okReq then
			ChangeHistoryService:SetWaypoint(wp .. "_Error")
			error("Error compilando Luau: " .. tostring(loadedFn))
		end
		okExec, resVal = pcall(loadedFn)
	end

	ChangeHistoryService:SetWaypoint(wp .. "_After")
	if not okExec then
		error(tostring(resVal))
	end

	return {
		ok = true,
		returned = resVal ~= nil and serializeValue(resVal) or nil,
		printed = printed,
	}
end

function handlers.get_output(params)
	local limit = math.clamp(tonumber(params.limit) or 50, 1, 200)
	local slice = {}
	local startIdx = math.max(1, #logBuffer - limit + 1)
	for i = startIdx, #logBuffer do
		table.insert(slice, logBuffer[i])
	end
	return { logs = slice, totalBuffered = #logBuffer }
end

local function postJson(endpoint, tbl)
	return pcall(function()
		return HttpService:RequestAsync({
			Url = BASE_URL .. endpoint,
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode(tbl),
		})
	end)
end

toggleBtn.Click:Connect(function()
	active = not active
	toggleBtn:SetActive(active)
	print("[CalFight MCP] " .. (active and "Conectado a " .. BASE_URL or "Pausado"))
end)

plugin.Unloading:Connect(function()
	unloaded = true
	if logConn then logConn:Disconnect() end
end)

print("[CalFight MCP] Plugin cargado -> puente en " .. BASE_URL)

task.spawn(function()
	local announcedConnect = false
	while not unloaded do
		if not active then
			task.wait(0.5)
			continue
		end

		local placeQ = HttpService:UrlEncode(game.Name or "RobloxPlace")
		local url = string.format("%s/poll?place=%s&placeId=%d&edit=1", BASE_URL, placeQ, game.PlaceId or 0)
		local ok, resp = pcall(function()
			return HttpService:RequestAsync({ Url = url, Method = "GET" })
		end)

		if ok and resp and resp.Success then
			if not announcedConnect then
				announcedConnect = true
				print("[CalFight MCP] Conectado con Antigravity en " .. BASE_URL)
			end
			local okDec, payload = pcall(function()
				return HttpService:JSONDecode(resp.Body)
			end)
			if okDec and payload and payload.job then
				local job = payload.job
				local h = handlers[job.action]
				if not h then
					postJson("/result", {
						id = job.id,
						ok = false,
						error = "Accion desconocida: " .. tostring(job.action),
						logs = handlers.get_output({ limit = 40 }).logs,
					})
				else
					local okRun, data = pcall(h, job.params or {})
					postJson("/result", {
						id = job.id,
						ok = okRun,
						data = okRun and data or nil,
						error = (not okRun) and tostring(data) or nil,
						logs = handlers.get_output({ limit = 40 }).logs,
					})
				end
				task.wait(0.02)
			else
				task.wait(0.25)
			end
		else
			announcedConnect = false
			task.wait(1.2)
		end
	end
end)
