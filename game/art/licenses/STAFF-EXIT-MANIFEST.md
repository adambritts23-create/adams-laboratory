# Staff exit and outdoor asset manifest

Added 2026-09-26.

## Kenney Nature Kit 2.1

- Creator: Kenney.
- Source: https://kenney.nl/assets/nature-kit
- Download: https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip
- License: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/
- Included license: `kenney-nature-CC0.txt`. Commercial use is explicitly allowed.
- Archive SHA256: FA7974A0D342BFE63C38664BA9F8EC1A4AAB8EA25F099BDC56870E33588C4D9D
- Imported files in `art/environment/exterior`: tree_oak.glb, tree_detailed.glb, tree_pineDefaultA.glb, plant_bushDetailed.glb, grass_large.glb, rock_smallA.glb.
- Adaptations: runtime scale/rotation, green foliage and matte bark/rock materials.

## Original project assets

- `is200.glb`: custom stylized sedan authored by `tools/build_exit_car.py`, source `art/source/exterior/is200.blend`. Shape and gold paint informed by the user-supplied Lexus IS200 photograph. No external car model or photographic texture imported. Runtime plates read TOL 981. Lexus name identifies the depicted car; no affiliation implied.
- Changing rooms, scanner enclosure, lockers, parking markings, facade and hills: original project geometry/materials in `scripts/staff_exit.gd`.
- Scanner photograph used only as visual reference; no vendor logo or image texture imported. Scanner behavior is a fictional game sequence, not a calibrated radiation measurement.
- Hanging coveralls reuse the existing Quaternius rigged outfit; existing CC0 credits remain in phase4-assets.json and quaternius-outfits-CC0.txt. Character assets themselves were not changed.
- Existing project PBR materials and sounds reused under their existing manifests. No new external audio imported.
