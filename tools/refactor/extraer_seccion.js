// Extrae las líneas [L0, L1] del cierre principal de js/game.js a un módulo-fábrica (mismo patrón que js/graficos/).
// uso: node tools/refactor/extraer_seccion.js <game.js> <L0> <L1> <ruta módulo> <espacio> <fábrica> "<título>" [--dry]
//  - lo que la sección usa del cierre: si es constante/función ya creada y nunca se reasigna -> se pasa por valor (destructuring)
//    si no (let, se reasigna, o se declara más abajo) -> se lee a través de D (getter, y setter si la sección lo escribe)
//  - lo que la sección declara y se usa afuera -> lo devuelve la fábrica y game.js lo desestructura en el mismo lugar
const fs = require('fs'), acorn = require('acorn'), escope = require('eslint-scope');
const args = process.argv.slice(2), dry = args.includes('--dry');
const [file, a, b, modPath, ns, factory, title] = args.filter(x => x !== '--dry'); const L0 = +a, L1 = +b;
const src = fs.readFileSync(file, 'utf8');
// el eval de la puerta de pruebas local vuelve 'dinámico' el alcance y el análisis no resolvería nada: se analiza una copia sin él (mismo largo)
const ast = acorn.parse(src.replace(/=> eval\(s\)/g, '=> evxl(s)'), { ecmaVersion: 2022, ranges: true, locations: true });
const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
const mainFn = ast.body.find(s => s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && /Function/.test(s.expression.callee.type) && s.loc.end.line - s.loc.start.line > 1000).expression.callee;
const scope = sm.acquire(mainFn);
const stmts = mainFn.body.body.filter(s => s.loc.start.line >= L0 && s.loc.end.line <= L1);
if (!stmts.length) throw new Error('sección vacía');
// el rango abarca líneas completas
const lineStart = n => { let i = 0, l = 1; while (l < n) { i = src.indexOf('\n', i) + 1; l++; } return i; };
const S0 = lineStart(L0), S1 = lineStart(L1 + 1);
for (const s of mainFn.body.body) if ((s.range[0] < S0 && s.range[1] > S0) || (s.range[0] < S1 && s.range[1] > S1)) throw new Error('el rango corta una sentencia en la línea ' + s.loc.start.line);
const inSec = n => n.range[0] >= S0 && n.range[1] <= S1;
const declHere = new Set(), info = {};
for (const v of scope.variables) {
  const d = v.defs[0]; if (!d) continue;
  const kind = d.type === 'FunctionName' ? 'function' : d.type === 'ClassName' ? 'class' : d.parent && d.parent.kind || d.type;
  info[v.name] = { v, kind, start: d.name.range[0] };
  if (inSec(d.name)) declHere.add(v.name);
}
const deps = new Map(), exportsOut = new Map(), problems = [];
const rewrite = [];   // [inicio, fin, texto]
for (const v of scope.variables) {
  const here = declHere.has(v.name), I = info[v.name]; if (!I) continue;
  for (const r of v.references) {
    const id = r.identifier, inside = inSec(id);
    if (inside && !here) {
      const d = deps.get(v.name) || { name: v.name, kind: I.kind, write: false, late: I.start > S0, written: false };
      if (r.isWrite()) d.write = true;
      deps.set(v.name, d); d.refs = (d.refs || []).concat([id]);
    } else if (!inside && here) {
      const e = exportsOut.get(v.name) || { name: v.name, kind: I.kind, writeOut: false, loadTime: false };
      if (r.isWrite()) e.writeOut = true;
      if (r.from === scope && id.range[0] < S0) e.loadTime = true;   // se usa al cargar, antes de crear el módulo
      exportsOut.set(v.name, e);
    }
  }
}
// dependencias reasignadas en cualquier lado
for (const d of deps.values()) d.reassigned = info[d.name].v.references.some(r => r.isWrite() && !(r.init));
const byVal = [], viaD = [];
for (const d of deps.values()) {
  const stable = (d.kind === 'const' || d.kind === 'function' || d.kind === 'class') && !d.reassigned && !d.write && !d.late;
  (stable ? byVal : viaD).push(d);
}
for (const d of viaD) for (const id of d.refs) {
  // shorthand {G} en objetos: G -> G: D.G
  rewrite.push([id.range[0], id.range[1], 'D.' + d.name, id]);
}
for (const e of exportsOut.values()) {
  if (e.writeOut) problems.push('exporta ' + e.name + ' pero afuera se reasigna');
  if (e.kind === 'let' || e.kind === 'var') { const wIn = info[e.name].v.references.some(r => r.isWrite() && !r.init && inSec(r.identifier)); if (wIn) problems.push('exporta ' + e.name + ' (' + e.kind + ') que la sección reasigna: afuera quedaría desactualizado'); }
  if (e.loadTime) problems.push('exporta ' + e.name + ' y se usa al cargar ANTES de la sección');
}
// shorthand properties
let body = src.slice(S0, S1);
const shorthandAt = new Set();
(function walk(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'Property' && n.shorthand && n.value.type === 'Identifier') shorthandAt.add(n.value.range[0]); for (const k in n) { const c = n[k]; if (Array.isArray(c)) c.forEach(walk); else if (c && typeof c.type === 'string') walk(c); } })(ast);
rewrite.sort((x, y) => y[0] - x[0]);
for (const [s, e, t] of rewrite) { const txt = shorthandAt.has(s) ? src.slice(s, e) + ': ' + t : t; body = body.slice(0, s - S0) + txt + body.slice(e - S0); }
const exp = [...exportsOut.keys()].sort();
const ind = '  ';
const mod = `// ${title}
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.${ns} = window.${ns} || {};

window.${ns}.${factory} = function ${factory}(D) {
  'use strict';
${byVal.length ? '  const { ' + byVal.map(d => d.name).sort().join(', ') + ' } = D;\n' : ''}
${body.replace(/\s+$/, '')}

${exp.length ? '  return { ' + exp.join(', ') + ' };' : ''}
};
`;
const depObj = byVal.map(d => d.name).sort().concat(viaD.map(d => `get ${d.name}() { return ${d.name}; }` + (d.write ? `, set ${d.name}(v) { ${d.name} = v; }` : '')));
const call = `// ===== ${title}: vive en ${modPath} =====\n${exp.length ? 'const { ' + exp.join(', ') + ' } = ' : ''}${ns}.${factory}({ ${depObj.join(', ')} });\n`;
console.log(JSON.stringify({ porValor: byVal.map(d => d.name), viaD: viaD.map(d => d.name + (d.write ? '(escribe)' : '') + (d.late ? '(tarde)' : '')), exporta: exp, problemas: problems }, null, 1));
if (!dry) {
  if (problems.length) { console.error('NO SE APLICÓ: hay problemas'); process.exit(2); }
  fs.writeFileSync(modPath, mod);
  fs.writeFileSync(file, src.slice(0, S0) + call + src.slice(S1));
  console.log('aplicado');
}
