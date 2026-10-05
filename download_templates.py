"""Extract only the two official single-thread web templates using HTTP ranges."""
from pathlib import Path
import io, json, urllib.request, zipfile

version = '4.7.2-stable'
release = json.load(urllib.request.urlopen(f'https://api.github.com/repos/godotengine/godot-builds/releases/tags/{version}'))
asset = next(a for a in release['assets'] if a['name'] == f'Godot_v{version}_export_templates.tpz')
class RemoteZip(io.RawIOBase):
    pos = 0
    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos+offset if whence == 1 else asset['size']+offset
        return self.pos
    def tell(self): return self.pos
    def read(self, length=-1):
        if length < 0: length=asset['size']-self.pos
        if not length: return b''
        request = urllib.request.Request(asset['browser_download_url'], headers={'Range':f'bytes={self.pos}-{self.pos+length-1}'})
        with urllib.request.urlopen(request) as response:
            if response.status != 206: raise RuntimeError('Download server did not honor byte range')
            data=response.read()
        self.pos += len(data)
        return data
target=Path(__file__).resolve().parent/'templates'
target.mkdir(exist_ok=True)
with zipfile.ZipFile(RemoteZip()) as archive:
    for name in ['web_nothreads_debug.zip','web_nothreads_release.zip']:
        (target/name).write_bytes(archive.read('templates/'+name))
        print('Ready:',name)
