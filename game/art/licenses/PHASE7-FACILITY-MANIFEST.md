# Conversion facility expansion — sources and modifications

Verified 2026-09-18. All runtime assets are local. The expansion adds seven selected models from the already downloaded Quaternius archive; no game assets were extracted from Half-Life or another commercial title.

## Newly selected external meshes

All seven are **Quaternius**, **Modular Sci-Fi MegaKit Standard**, **CC0 1.0 Universal**. Source: https://quaternius.itch.io/modular-sci-fi-megakit . The publisher explicitly permits commercial use under CC0. Existing source archive: `art/source/phase5/megakit.zip`; license text: `art/licenses/phase5-megakit-License_Standard.txt`.

| Runtime file under `art/environment/props/` | Use and modifications |
|---|---|
| `Prop_Barrel_Large.glb` | Sealed drums in storage and lower powder lab. Origin/units normalized to 1.2 m height, smooth shading, aged blue or cleaner ivory runtime material; varied placement and scale. |
| `Prop_Crate3.glb` | Pallet and rack cargo. Normalized to 1.4 m height; smooth shading, painted steel material, repeated instances. |
| `Prop_Crate4.glb` | Alternate sealed containers. Normalized to 1.7 m height; smooth shading, painted steel material, varied scale. |
| `Prop_Vent_Big.glb` | Furnace ventilation grille. Thin original shape normalized to 0.10 m thickness (approximately 2.91 m width), rotated vertically, weathered material. |
| `Prop_PipeHolder.glb` | Overhead pipe supports. Normalized to 1 m source height, runtime scale 0.6, inverted and retextured. |
| `Door_DarkMetal.glb` | Restricted storage and distant service portals. Normalized to 4 m height, enlarged for industrial access, rust material. |
| `Column_Pipes.glb` | Distant utility risers. Normalized to 5.8 m height, nonuniform runtime scale and steel material. |

Reproduction: `tools/build_facility_assets.py`, run with the existing bundled Blender from the project root. Exact source and runtime paths, file hashes and normalization data: `art/licenses/phase7-models.json`.

## Existing external assets reused in new contexts

| Asset | Creator / source | License | Files and modifications |
|---|---|---|---|
| Metal supports and stairs | Quaternius / https://quaternius.itch.io/modular-sci-fi-megakit | CC0 1.0 | `art/environment/props/Column_MetalSupport.glb`, `Platform_Stairs_4.glb`; existing normalized files, instanced, scaled and retextured for hall framing and inaccessible service stairs. |
| Concrete Floor 02 | Rob Tuytel / https://polyhaven.com/a/concrete_floor_02 | CC0 1.0 | `art/environment/concrete_floor_02_{diff,nor_gl,rough}_1k.jpg`; existing 1K maps, engine tint/tiling and normal-strength treatment for hall surfaces. |
| Rusty Metal 02 | Rob Tuytel / https://polyhaven.com/a/rusty_metal_02 | CC0 1.0 | `art/environment/rusty_metal_02_{diff,nor_gl,rough}_1k.jpg`; engine tint, tiling and roughness for aged equipment and crane. |
| Blue Metal Plate | Rob Tuytel / https://polyhaven.com/a/blue_metal_plate | CC0 1.0 | `art/environment/blue_metal_plate_{diff,nor_gl,rough}_1k.jpg`; engine tint and metallic/roughness variations for maintained steel and wall panels. |
| Lab Assets | jamesdev / MilkAndBanana / https://milkandbanana.itch.io/lab-assets | CC0 1.0 | Existing laboratory props retained in place. No additional lab mesh files imported. |

Poly Haven licensing rechecked at https://polyhaven.com/license . Existing Phase 5 per-file manifest remains authoritative for earlier imports.

## Recorded spatial audio

All source recordings below are **Joseph SARDIN / BigSoundBank**, **CC0 1.0**. Existing edited mono recordings are reused; no new recordings are downloaded. Source evidence and original derivative recipes remain in the Phase 6 manifest and JSON. The Phase 7 change is positional placement, gain, pitch and looping in the existing `LabEnvironment` bus.

| Existing runtime recording | Original source | New application |
|---|---|---|
| `art/audio/phase6/motor.wav` | https://bigsoundbank.com/beer-compressor-1-s3091.html | Principal vessel motor at normal pitch; filter machinery at 1.21 pitch. |
| `art/audio/phase6/hvac.wav` | https://bigsoundbank.com/ventilation-3-s2434.html | Furnace ventilation at 0.68 pitch. |
| `art/audio/phase6/transformer.wav` | https://bigsoundbank.com/electric-transformer-2-s0086.html | Tank-area electrical hum at 0.83 pitch. |
| `art/audio/phase6/drain.wav` | https://bigsoundbank.com/drops-metal-sink-s1383.html | Local lower-deck drain at 0.90 pitch. |
| `art/audio/phase6/clang.wav` | https://bigsoundbank.com/iron-bar-falls-2-s0235.html | Intermittent remote metallic impacts. |
| `art/audio/phase6/hiss.wav` | https://bigsoundbank.com/pressure-cooker-s0805.html | Intermittent off-screen pneumatic release. |

Loop endpoints use decoded PCM frame counts, so imported QOA compression does not truncate the new loops. No music added. Existing Geiger and mission audio systems remain intact.

## Original work and supplied references

Hall layout, cylindrical equipment, pipe networks, valves, platforms, ladders, fixtures, lower-annex dressing, signs, liquid shader changes, irregular precipitation geometry and review tooling are authored for this project. Existing independent shaders are extended; no new external shader code is copied.

`art/source/phase7/facility-map.png` and `atmosphere-reference.png` are user-provided visual references. They are **not claimed as CC0**, are not runtime assets, and are excluded from import by `.gdignore`. Existing Adam/Axel meshes, portraits and provenance are unchanged. The human-scale review image temporarily poses the existing Adam rig beside the machinery; gameplay character placement is unchanged.
