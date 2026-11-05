from pathlib import Path
import re

# 1. Update index.html with cache-busting query params
index_path = Path('index.html')
content = index_path.read_text(encoding='utf-8')

# Replace library and script tags with ?v=2.2
scripts = [
    'lib/three.min.js',
    'lib/CopyShader.js',
    'lib/LuminosityHighPassShader.js',
    'lib/EffectComposer.js',
    'lib/RenderPass.js',
    'lib/ShaderPass.js',
    'lib/UnrealBloomPass.js',
    'lib/mqtt.min.js',
    'js/physics.js',
    'js/destruction.js',
    'js/animations.js',
    'js/game.js'
]

for s in scripts:
    content = re.sub(rf'<script src="{re.escape(s)}(\?v=[^"]*)?"></script>', f'<script src="{s}?v=2.2"></script>', content)

index_path.write_text(content, encoding='utf-8')
print('Updated index.html with ?v=2.2')

# 2. Update js/game.js viaScript
game_path = Path('js/game.js')
game_content = game_path.read_text(encoding='utf-8')

old_via = "const viaScript=()=>Promise.all([window.BB_ATLAS?0:script('ciudad/atlas.js'),(window.BB_MODELS&&window.BB_MODELS[name])?0:script('ciudad/'+name+'.js')]).then(()=>{const d=window.BB_MODELS[name];d.textures[0].source=window.BB_ATLAS;return d;});"
new_via = "const viaScript=()=>Promise.all([window.BB_ATLAS?0:script('ciudad/atlas.js'),(window.BB_MODELS&&window.BB_MODELS[name])?0:script('ciudad/'+name+'.js')]).then(()=>{const d=window.BB_MODELS[name];if(d.textures[0]&&(!d.textures[0].source||d.textures[0].source===''))d.textures[0].source=window.BB_ATLAS;return d;});"

if old_via in game_content:
    game_content = game_content.replace(old_via, new_via)
    print('Updated viaScript in js/game.js')
else:
    print('viaScript pattern not found directly, checking regex...')
    game_content = re.sub(
        r'd\.textures\[0\]\.source=window\.BB_ATLAS;',
        r'if(d.textures[0]&&(!d.textures[0].source||d.textures[0].source===\'\'))d.textures[0].source=window.BB_ATLAS;',
        game_content
    )
    print('Regex applied to viaScript in js/game.js')

# Also add set_playa_pro_v2 to PROP_DIMS
if 'sombrilla_verde: [4, 5],' in game_content and 'set_playa_pro_v2:' not in game_content:
    game_content = game_content.replace('sombrilla_verde: [4, 5],', 'sombrilla_verde: [4, 5], set_playa_pro_v2: [4, 5],')
    print('Added set_playa_pro_v2 to PROP_DIMS')

game_path.write_text(game_content, encoding='utf-8')

# 3. Update js/destruction.js
dest_path = Path('js/destruction.js')
dest_content = dest_path.read_text(encoding='utf-8')

# Replace carveBox InstancedMesh creation to ensure instanceColor and needsUpdate
old_mesh_code = """      DEST_GEO = DEST_GEO || new THREE.BoxGeometry(1, 1, 1);
      DEB_MAT = DEB_MAT || new THREE.MeshLambertMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(DEST_GEO, d.bb ? DEB_MAT : d.m.material, keep.length);
      mesh.receiveShadow = true; mesh.castShadow = true;
      keep.forEach((p, i) => {
        _dm.compose(_dv.set(p[0], p[1], p[2]), _dq, _ds.set(p[3], p[4], p[5]));
        mesh.setMatrixAt(i, _dm);
        if (d.bb) mesh.setColorAt(i, new THREE.Color(p[6]).multiplyScalar(.94 + Math.random() * .12));
      });
      if (window.scene) window.scene.add(mesh);"""

new_mesh_code = """      DEST_GEO = DEST_GEO || new THREE.BoxGeometry(1, 1, 1);
      DEB_MAT = DEB_MAT || new THREE.MeshLambertMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(DEST_GEO, d.bb ? DEB_MAT : d.m.material, keep.length);
      mesh.receiveShadow = true; mesh.castShadow = true;
      if (d.bb) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(keep.length * 3), 3);
      }
      keep.forEach((p, i) => {
        _dm.compose(_dv.set(p[0], p[1], p[2]), _dq, _ds.set(p[3], p[4], p[5]));
        mesh.setMatrixAt(i, _dm);
        if (d.bb) mesh.setColorAt(i, new THREE.Color(p[6]).multiplyScalar(.94 + Math.random() * .12));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (window.scene) window.scene.add(mesh);"""

if old_mesh_code in dest_content:
    dest_content = dest_content.replace(old_mesh_code, new_mesh_code)
    print('Updated carveBox InstancedMesh in js/destruction.js')
else:
    print('old_mesh_code not found directly in js/destruction.js, checking with LF...')
    old_mesh_code_lf = old_mesh_code.replace('\r\n', '\n')
    dest_content_lf = dest_content.replace('\r\n', '\n')
    if old_mesh_code_lf in dest_content_lf:
        dest_content = dest_content_lf.replace(old_mesh_code_lf, new_mesh_code.replace('\r\n', '\n'))
        print('Updated carveBox with LF in js/destruction.js')

# Update worldBreak vertical height filter
old_filter = """      // FILTRO DE ALTURA CRÍTICO:
      // Si el elemento está en un piso superior o en el tejado (|q[1] - c.y| > r * 1.1 + 0.3),
      // JAMÁS se toca. Esto elimina al 100% que caigan escombros desde el techo al golpear la planta baja!
      if (Math.abs(q[1] - c.y) > r * 1.1 + 0.3) continue;"""

new_filter = """      // FILTRO DE ALTURA ESTRICTO PARA EDIFICIOS:
      // Si el elemento está en un piso superior o en el tejado, JAMÁS se toca.
      // Golpear la planta baja solo afecta la zona inmediata del golpe (<= 1.8m vertical).
      const dy = Math.abs(q[1] - c.y);
      if (d.isBuilding) {
        if (dy > Math.min(r * 0.75, 2.0) || q[1] > c.y + 1.8) continue;
      } else {
        if (dy > r * 1.1 + 0.3) continue;
      }"""

if old_filter in dest_content:
    dest_content = dest_content.replace(old_filter, new_filter)
    print('Updated vertical height filter in js/destruction.js')
else:
    old_filter_lf = old_filter.replace('\r\n', '\n')
    dest_content_lf = dest_content.replace('\r\n', '\n')
    if old_filter_lf in dest_content_lf:
        dest_content = dest_content_lf.replace(old_filter_lf, new_filter.replace('\r\n', '\n'))
        print('Updated vertical height filter with LF in js/destruction.js')

dest_path.write_text(dest_content, encoding='utf-8')
print('Finished updating js/destruction.js')
