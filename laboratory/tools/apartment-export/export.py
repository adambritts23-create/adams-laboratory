"""Export the original apartment without loading game saves or changing the Godot project.
Usage: python export.py --source PATH_TO_GAME --godot PATH_TO_GODOT_CONSOLE
"""
import argparse, hashlib, json, os, re, shutil, subprocess, tempfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--godot',type=Path,required=True)
args=parser.parse_args()
repo=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='adam-apartment-') as temp:
    stage=Path(temp);seen=set()
    def copy(rel):
        if rel in seen:return
        seen.add(rel);src=args.source/rel
        if not src.is_file():return
        dest=stage/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
        if src.suffix in ('.gd','.gdshader','.tscn'):
            for path in re.findall(r'res://([^"\n]+)',src.read_text(encoding='utf-8')):copy(path)
    copy('scripts/apartment_5c.gd')
    for stem in ('concrete_floor_02','rusty_metal_02','blue_metal_plate'):
        for suffix in ('diff','nor_gl','rough'):copy(f'art/environment/{stem}_{suffix}_1k.jpg')
    source=(args.source/'scripts/bench_expansion.gd').read_text(encoding='utf-8')
    model=source[source.index('func profile_part('):source.index('func shot_sound(')]
    (stage/'scripts/export_display.gd').write_text('extends "res://scripts/lab_props.gd"\n'+model,encoding='utf-8')
    (stage/'project.godot').write_text('config_version=5\n[application]\nconfig/name="Apartment export"\n[rendering]\nrenderer/rendering_method="gl_compatibility"\n')
    shutil.copy2(Path(__file__).with_name('export.gd'),stage/'export.gd')
    env=os.environ.copy()
    for key in ('APPDATA','LOCALAPPDATA'):
        location=stage/key;location.mkdir();env[key]=str(location)
    command=[str(args.godot),'--headless','--path',str(stage),'--log-file',str(stage/'export.log')]
    subprocess.run(command+['--editor','--import','--quit'],check=True,env=env)
    subprocess.run(command+['--script','export.gd'],check=True,env=env)
    output=repo/'public/models/apartment5c';output.mkdir(parents=True,exist_ok=True)
    shutil.copy2(stage/'apartment.glb',output/'apartment.glb')
    shutil.copy2(stage/'apartment.json',repo/'src/upperFloor/apartmentLayout.json')
    manifest=json.loads((output/'provenance.json').read_text())
    manifest['meshCount']=json.loads((stage/'apartment.json').read_text())['meshCount']
    manifest['sourceHashes']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (stage/'scripts').glob('apartment*.gd')}
    (output/'provenance.json').write_text(json.dumps(manifest,indent=2))

    assets=[{'file':p.relative_to(repo/'public').as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'purpose':'Original user-requested Godot apartment geometry and provenance; no game code, saves or neighboring rooms.'} for p in output.iterdir() if p.is_file()]
    (repo/'scripts/public-apartment-manifest.json').write_text(json.dumps(assets,indent=2))
