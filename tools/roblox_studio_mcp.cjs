'use strict';

/**
 * roblox_studio_mcp.cjs — Servidor MCP (stdio JSON-RPC 2.0) + puente HTTP local (127.0.0.1:28945)
 * Conecta Antigravity directamente con el plugin CalFightStudioMCP.lua dentro de Roblox Studio.
 */

const http = require('http');
const crypto = require('crypto');

const HTTP_HOST = '127.0.0.1';
const HTTP_PORT = Number(process.env.ROBLOX_MCP_PORT || 28945);
const CMD_TIMEOUT_MS = 25000;

// ============================================================
// Cola de comandos hacia el plugin de Roblox Studio
// ============================================================
const pendingQueue = []; // { id, action, params, resolve, reject, timer }
const inflight = new Map(); // id -> { resolve, reject, timer }
let studioState = {
  connected: false,
  lastPollAt: 0,
  placeName: '',
  placeId: 0,
  isEdit: false,
  recentLogs: [],
};

function sendCommandToStudio(action, params = {}) {
  const ageMs = Date.now() - studioState.lastPollAt;
  if (!studioState.lastPollAt || ageMs > 8000) {
    return Promise.reject(
      new Error(
        `Roblox Studio no esta conectado al MCP en http://${HTTP_HOST}:${HTTP_PORT}. ` +
        `Asegurate de tener abierto Roblox Studio, haber permitido HTTP a 127.0.0.1 y tener activo el boton 'CalFight MCP' en Plugins.`
      )
    );
  }
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      const qi = pendingQueue.findIndex(q => q.id === id);
      if (qi !== -1) pendingQueue.splice(qi, 1);
      inflight.delete(id);
      reject(new Error(`Timeout esperando respuesta de Roblox Studio (${action}, ${CMD_TIMEOUT_MS}ms).`));
    }, CMD_TIMEOUT_MS);

    const job = { id, action, params, resolve, reject, timer };
    pendingQueue.push(job);
    inflight.set(id, job);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 20 * 1024 * 1024) {
        reject(new Error('Payload demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

let httpServer = null;
let httpError = null;

function startHttpBridge() {
  httpServer = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      if (req.method === 'GET' && req.url.startsWith('/poll')) {
        const u = new URL(req.url, `http://${HTTP_HOST}:${HTTP_PORT}`);
        studioState.connected = true;
        studioState.lastPollAt = Date.now();
        studioState.placeName = u.searchParams.get('place') || studioState.placeName;
        studioState.placeId = Number(u.searchParams.get('placeId') || 0);
        studioState.isEdit = u.searchParams.get('edit') !== '0';

        const job = pendingQueue.shift();
        if (!job) {
          res.end(JSON.stringify({ ok: true, job: null }));
          return;
        }
        res.end(JSON.stringify({ ok: true, job: { id: job.id, action: job.action, params: job.params } }));
        return;
      }

      if (req.method === 'POST' && req.url === '/result') {
        const body = await readJsonBody(req);
        studioState.lastPollAt = Date.now();
        if (Array.isArray(body.logs)) {
          studioState.recentLogs = body.logs.slice(-200);
        }
        const job = inflight.get(body.id);
        if (job) {
          inflight.delete(body.id);
          clearTimeout(job.timer);
          if (body.ok) job.resolve(body.data);
          else job.reject(new Error(body.error || 'Error ejecutando comando en Roblox Studio'));
        }
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (req.method === 'POST' && req.url === '/logs') {
        const body = await readJsonBody(req);
        studioState.lastPollAt = Date.now();
        if (Array.isArray(body.logs)) {
          studioState.recentLogs = body.logs.slice(-200);
        }
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });

  httpServer.on('error', err => {
    httpError = err.message;
    process.stderr.write(`[roblox-studio-mcp] HTTP error (${HTTP_HOST}:${HTTP_PORT}): ${err.message}\n`);
  });

  httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
    process.stderr.write(`[roblox-studio-mcp] Bridge HTTP escuchando en http://${HTTP_HOST}:${HTTP_PORT}\n`);
  });
}

// ============================================================
// Definicion de Herramientas MCP
// ============================================================
const TOOLS = [
  {
    name: 'studio_status',
    description: 'Verifica si el plugin CalFightStudioMCP dentro de Roblox Studio esta conectado al puente HTTP local y devuelve datos del proyecto abierto.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'studio_get_tree',
    description: 'Lista la jerarquia de instancias (Explorer) en Roblox Studio a partir de una ruta (ej. "Workspace", "Workspace.Map", "ServerScriptService", o "game" para servicios raiz).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta en Roblox usando puntos (por defecto "game"). Ej: "Workspace.Map", "ReplicatedStorage".' },
        depth: { type: 'integer', description: 'Profundidad maxima a listar (1 a 5, defecto 2).' },
        limit: { type: 'integer', description: 'Maximo de hijos por nodo (defecto 120).' },
      },
    },
  },
  {
    name: 'studio_find_instances',
    description: 'Busca instancias dentro de una ruta por subcadena de nombre y/o ClassName (ej. Script, LocalScript, ModuleScript, SpawnLocation, RemoteEvent).',
    inputSchema: {
      type: 'object',
      properties: {
        rootPath: { type: 'string', description: 'Ruta base (defecto "game").' },
        nameContains: { type: 'string', description: 'Texto a buscar en Name (sin distincion de mayusculas).' },
        className: { type: 'string', description: 'Filtro exacto por ClassName o IsA.' },
        limit: { type: 'integer', description: 'Maximo de resultados (defecto 80).' },
      },
    },
  },
  {
    name: 'studio_read_script',
    description: 'Lee el codigo fuente Luau de cualquier Script, LocalScript o ModuleScript en Roblox Studio.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta completa del script, ej. "ServerScriptService.AscensorTorreAurora".' },
        startLine: { type: 'integer', description: 'Linea inicial (1-indexed, opcional).' },
        endLine: { type: 'integer', description: 'Linea final (opcional).' },
      },
      required: ['path'],
    },
  },
  {
    name: 'studio_write_script',
    description: 'Crea o actualiza un Script, LocalScript o ModuleScript dentro de Roblox Studio (registra punto Ctrl+Z en ChangeHistoryService).',
    inputSchema: {
      type: 'object',
      properties: {
        parentPath: { type: 'string', description: 'Ruta del padre, ej. "ServerScriptService.CalFight".' },
        name: { type: 'string', description: 'Nombre del script.' },
        className: { type: 'string', enum: ['Script', 'LocalScript', 'ModuleScript'], description: 'Clase del script (por defecto ModuleScript).' },
        source: { type: 'string', description: 'Codigo fuente Luau completo.' },
        disabled: { type: 'boolean', description: 'Opcional: desactivar script (Enabled=false / Disabled=true).' },
      },
      required: ['parentPath', 'name', 'source'],
    },
  },
  {
    name: 'studio_get_properties',
    description: 'Inspecciona propiedades clave (Position, Size, CFrame, Color, Material, Transparency, CanCollide, Anchored, Attributes, etc.) de una instancia en Studio.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta de la instancia, ej. "Workspace.Map.Suelo.MainPart".' },
      },
      required: ['path'],
    },
  },
  {
    name: 'studio_run_luau',
    description: 'Ejecuta codigo Luau arbitrario dentro de Roblox Studio (envuelto en ChangeHistoryService para poder deshacer con Ctrl+Z) y devuelve print/warn/return.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Codigo Luau a ejecutar en el contexto Edit de Roblox Studio.' },
        waypointName: { type: 'string', description: 'Nombre del paso en historial de deshacer (opcional).' },
      },
      required: ['code'],
    },
  },
  {
    name: 'studio_get_output',
    description: 'Devuelve los mensajes y errores recientes del Output de Roblox Studio capturados via LogService.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Cantidad maxima de lineas recientes (defecto 50).' },
      },
    },
  },
];

async function callTool(name, args = {}) {
  if (name === 'studio_status') {
    const ageMs = studioState.lastPollAt ? Date.now() - studioState.lastPollAt : null;
    const active = ageMs !== null && ageMs < 6000;
    return {
      connected: active,
      bridgeListening: !httpError,
      bridgeUrl: `http://${HTTP_HOST}:${HTTP_PORT}`,
      httpError,
      lastPollAgoMs: ageMs,
      placeName: studioState.placeName || null,
      placeId: studioState.placeId || 0,
      isEditMode: studioState.isEdit,
      bufferedLogs: studioState.recentLogs.length,
    };
  }
  if (name === 'studio_get_output') {
    // Si esta conectado, pedimos logs frescos + devolvemos lo capturado
    const limit = Math.max(1, Math.min(200, Number(args.limit) || 50));
    if (studioState.lastPollAt && Date.now() - studioState.lastPollAt < 6000) {
      const fresh = await sendCommandToStudio('get_output', { limit });
      return fresh;
    }
    return { logs: studioState.recentLogs.slice(-limit), note: 'Studio no activo ahora; mostrando ultimos logs en memoria.' };
  }
  return await sendCommandToStudio(name.replace(/^studio_/, ''), args);
}

// ============================================================
// Transporte MCP JSON-RPC 2.0 sobre Stdio
// ============================================================
function writeMsg(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

async function handleRpc(msg) {
  if (!msg || typeof msg !== 'object') return;
  const { id, method, params } = msg;

  // Notificaciones sin id
  if (id === undefined || id === null) {
    return;
  }

  try {
    if (method === 'initialize') {
      const clientProto = (params && params.protocolVersion) || '2024-11-05';
      writeMsg({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: clientProto,
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'roblox-studio-mcp',
            version: '1.0.0',
          },
        },
      });
      return;
    }

    if (method === 'ping') {
      writeMsg({ jsonrpc: '2.0', id, result: {} });
      return;
    }

    if (method === 'tools/list') {
      writeMsg({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      });
      return;
    }

    if (method === 'tools/call') {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      try {
        const result = await callTool(toolName, toolArgs);
        writeMsg({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        });
      } catch (toolErr) {
        writeMsg({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: toolErr.message }],
          },
        });
      }
      return;
    }

    writeMsg({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (err) {
    writeMsg({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err.message },
    });
  }
}

function startStdio() {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buf += chunk;
    while (true) {
      // Soportar tanto Content-Length LSP como JSON por linea
      if (buf.startsWith('Content-Length:')) {
        const sepIdx = buf.indexOf('\r\n\r\n');
        const sepAlt = buf.indexOf('\n\n');
        const idx = sepIdx !== -1 ? sepIdx : sepAlt;
        const sepLen = sepIdx !== -1 ? 4 : 2;
        if (idx === -1) break;
        const header = buf.slice(0, idx);
        const m = /Content-Length:\s*(\d+)/i.exec(header);
        if (!m) { buf = buf.slice(idx + sepLen); continue; }
        const len = parseInt(m[1], 10);
        const bodyStart = idx + sepLen;
        if (Buffer.byteLength(buf.slice(bodyStart), 'utf8') < len) break;
        const rawBuf = Buffer.from(buf.slice(bodyStart), 'utf8');
        const jsonText = rawBuf.slice(0, len).toString('utf8');
        buf = rawBuf.slice(len).toString('utf8');
        try { handleRpc(JSON.parse(jsonText)); } catch (e) { process.stderr.write(`Parse error: ${e.message}\n`); }
      } else {
        const nl = buf.indexOf('\n');
        if (nl === -1) break;
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try { handleRpc(JSON.parse(line)); } catch (e) { process.stderr.write(`Parse error: ${e.message}\n`); }
      }
    }
  });
  process.stdin.on('end', () => {
    if (httpServer) httpServer.close();
    process.exit(0);
  });
}

startHttpBridge();
startStdio();
