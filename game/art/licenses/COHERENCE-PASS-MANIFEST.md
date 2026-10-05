# Facility geography and precipitation correction

2026-09-18. Existing CC0 environment models, PBR surfaces and Joseph SARDIN / BigSoundBank audio are reused under the provenance recorded in `CONNECTED-PLANT-MANIFEST.md`, `PHASE7-FACILITY-MANIFEST.md` and `PHASE6-AUDIO-MANIFEST.md`. No new external downloads.

## Added visitor

- Base mesh: Quaternius Universal Base Characters, existing local `Superhero_Female_FullBody.gltf`; CC0 1.0 Universal. Publisher: https://quaternius.com/packs/universalbasecharacters.html . Retained license: `art/source/quaternius/Universal Base Characters[Standard]/License_Standard.txt`.
- Garments: Quaternius Modular Character Outfits — Fantasy, female peasant body, arms, legs and feet; existing local source pack, CC0 1.0 Universal. Publisher: https://quaternius.com/packs/modularcharacteroutfits.html . Retained license: `art/source/outfits/Modular Character Outfits - Fantasy[Standard]/License_Standard.txt`.
- Hair: existing Quaternius `Hair_Long.gltf`, from the same Universal Base Characters pack, CC0 1.0.
- User-supplied photograph: `art/reference/coherence/lab-visitor.png`. Used as a likeness reference and registered face texture at the user's request. This photograph is not claimed to be CC0 or relicensed.
- Modifications: retained female head/hand topology, white garment material and waist shaping, dark hair/longer rear strands, earrings, relaxed skeletal pose, reference-texture registration and overall scaling to approximately 1.54 scene metres. The result is a stylized reference-inspired character, not a scanned or exact likeness.
- Reproducible authoring: `tools/character_authoring/build_lab_visitor.py`; runtime mesh: `art/characters/rigged/lab_visitor.glb`; runtime placement/shader: `scripts/lab_visitor.gd` and `materials/visitor_skin.gdshader`.

Bay divisions, route changes, sign text, pipe rerouting and qualitative animation controls are original project work. The supplied facility sketch remains an art-direction reference; no operational process model or real operating values are introduced. Adam and Axel assets were not edited.
