"""Combine the laboratory application and Godot export for one Pages website."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parent
site = root / 'site'
lab = site / 'laboratory'
shutil.copytree(root / 'laboratory/dist', lab, dirs_exist_ok=True)
shutil.copytree(root / 'dist', lab / 'game', dirs_exist_ok=True)
(site / '.nojekyll').touch()
(site / 'index.html').write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=laboratory/"><title>Adam’s Laboratory</title><a href="laboratory/">Open Adam’s Laboratory</a>', encoding='utf-8')
print('Combined website:', site)
