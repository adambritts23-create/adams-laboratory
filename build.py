"""Build this isolated browser port. GODOT points to the matching 4.7.2 binary."""
from pathlib import Path
import os, shutil, subprocess

root = Path(__file__).resolve().parent
godot = os.environ.get('GODOT', 'godot')
dist = root / 'dist'
# Only remove this project's generated export before rebuilding.
assert dist.resolve() == root.resolve() / 'dist'
if dist.exists(): shutil.rmtree(dist)
dist.mkdir(exist_ok=True)
for args in [ ['--editor', '--import', '--quit'], ['--export-release', 'Web'] ]:
    subprocess.run([godot, '--headless', '--path', str(root/'game'), *args], check=True)
shutil.copytree(root/'game/science', dist/'science', dirs_exist_ok=True)
(dist/'.nojekyll').touch()
page = dist/'index.html'
html = page.read_text(encoding='utf-8')
html = html.replace("'onProgress': function", """'onPrint': (...args) => {
 console.log(...args);
 if(location.hostname==='127.0.0.1' && location.port==='5197') navigator.sendBeacon('/runtime-log',args.join(' '));
},
'onPrintError': (...args) => {
 console.error(...args);
 if(location.hostname==='127.0.0.1' && location.port==='5197') navigator.sendBeacon('/runtime-log',args.join(' '));
},
'onProgress': function""")
(dist/'game.html').write_text(html, encoding='utf-8')
for path in (root/'web').iterdir():
    if path.is_file(): shutil.copy2(path, dist/path.name)
print('Browser build:', dist)
