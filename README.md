# Godot browser port — experimental

This is an isolated snapshot of `adams-laboratory-game`, not the React/Three.js web laboratory. Neither original project was modified.

## Current result

- Godot 4.7.2 successfully exports the complete runtime project to single-threaded WebAssembly/WebGL2.
- Browser workers replace the two Windows-only Node subprocess bridges. All solver modules are retained; only database loading and CLI transport change.
- Browser checks pass for wet-lab results (108 points), a five-point pH calculation sweep, invalid inputs, and cancellation.
- Exact deep comparisons against the original desktop bridge pass at wet-lab doses 0 and 25 mL and for the pH sweep. Run `node check-parity.mjs <original-game-directory>` to repeat.
- The reduced-world build renders and accepts movement in the browser. Apartment entry, outside-home entry and return to laboratory have been checked.
- The lab, apartment and connecting road remain. Distant forest, lake, meadow and outer-town additions are omitted, with boundaries around the retained corridor.
- Approximately 20,793 nodes / 17,027 meshes remain, down from 37,383 / 29,199. Lightweight shaders and flat lighting avoid the long original shader startup stall. Original shaders are preserved in `desktop-materials/`.
- This is a playable prototype, not a fully verified browser release. Vehicles, every object interaction, audio and persistent saves still need broader play-testing.

## Changes

- `game/scripts/science_workbench.gd` and `calculation_workstation.gd`: async JavaScriptBridge submit/poll/cancel, with existing stale-result checks and timeout handling.
- `game/science/bridge.mjs` and `calculation_bridge.mjs`: fetch database, remove Node filesystem CLI footer. Same numerical calculations.
- `web/chemistry.js` and `chemistry-worker.mjs`: isolated worker per request, errors, termination and timeouts.
- Logging uses `user://`; music loads imported Godot resources.
- Texture imports capped at 1024 pixels in this copy. Desktop source pixels remain untouched. Game pack reduced from 164,289,136 to 108,488,448 bytes.
- Experimental profile disables real-time reflection probes, light shadows and initial secondary viewport rendering. Instrument screens refresh at a controlled rate; visual quality is reduced for browser performance.
- Diagnostic startup markers identify completed build stages.

## Build and inspect

Use Godot **4.7.2**, Python 3, and the matching official export templates:

```powershell
python download_templates.py
$env:GODOT = 'C:/path/to/Godot_v4.7.2-stable_win64_console.exe'
python build.py
python serve.py
```

Open `http://127.0.0.1:5197/`. The landing page does not start the heavy game automatically. The chemistry checks are at `/verify.html`; the experimental game is `/game.html`.

The local server records diagnostic output in `browser-runtime.log`. Production builds only send diagnostics when running on the specific local preview address. Game saves use browser-local storage rather than desktop saves.

`templates/`, `dist/`, `.godot/`, local save directories and logs are ignored by Git. Authoring source art, validation captures and tool installations were excluded when copying the original project.

## GitHub Pages

`.github/workflows/pages.yml` is a manual-only workflow for this separate repository. It has not been run or deployed. After publishing the repository, configure Settings → Pages → Source as GitHub Actions, then run “Build browser game” from the Actions tab.

The workflow builds and uploads the `dist` artifact, avoiding Git's 100 MiB file limit for the generated pack. It uses single-threaded web templates so Pages does not need custom cross-origin isolation headers. All URLs are relative to support project Pages paths.

Before publishing: test vehicles and every workstation, verify audio and persistent saves, and review distribution rights for game assets. No GitHub upload or deployment has been performed.

## Playing

WASD to walk, mouse to look, Shift to sprint, E to interact, G to put down glassware, and Esc for the menu. The menu includes direct entry to Adam’s Home, the street outside, the laboratory and workstations. Click the game to capture the mouse again after releasing it.

The first load downloads roughly 150 MB and constructs the scene; allow about 30 seconds on this test machine. Frame rate varies by GPU. The separate existing web laboratory and original desktop game are untouched.

## Browser scope and performance update

Collectible green chunks, platinum crucibles, buyer characters and the collectible economy are omitted. Real calculated precipitates, carrying glassware and filtration remain. Screen refresh uses a cached viewport list instead of repeated full-scene scans. Gyrocopter travel is bounded to the reduced corridor, altitude is limited and its camera draws to 300 metres. The reported flight crash had no recorded exception; these changes reduce load and prevent flight beyond the retained terrain, but a crash-free flight session is not yet verified.

### Additional rendering reductions

Apartment window views now render at most eight times per second at a maximum width of 640 pixels, with 300-metre camera range, instead of every frame at up to 960 pixels and 1,800 metres. Small exterior decoration stops drawing at 55 metres; medium objects at 160 metres; large landmarks remain. Laboratory actor and facility animations stop updating when the room is hidden. Main-view resolution and numerical chemistry are unchanged. This is a cost reduction, not a measured FPS guarantee; test sustained walking and flying on the target browser before publication.

## Publish with GitHub Desktop

Choose File → Add local repository and select this `godot-web` folder. Click Publish repository (the first publication creates origin). Later commits use Push origin. The browser build is generated by the manual Pages workflow; do not commit `dist/`.
