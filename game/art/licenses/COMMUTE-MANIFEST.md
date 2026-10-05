# Västerås commute assets and geographic data

Map data © OpenStreetMap contributors. The downloaded geographic database and adapted data/commute.json are available under the Open Database License (ODbL) 1.0.

- Copyright and attribution: https://www.openstreetmap.org/copyright
- Database license: https://opendatacommons.org/licenses/odbl/1-0/
- Source extract: art/source/commute/context.osm, downloaded 2026-09-27 from https://api.openstreetmap.org/api/0.6/map?bbox=16.577,59.617,16.614,59.648
- Routing response: art/source/commute/osrm-route.json, from the OSRM public routing service, based on OpenStreetMap data.
- Adapted database: data/commute.json. Local metre projection, route corridor filtering, road buffering/union and triangulation. Rebuild with tools/build_commute_data.py then tools/build_commute_surfaces.py. The latter uses Shapely 2.1.2; package licenses remain in tools/geometry_deps.

Google Maps directions were inspected to confirm the user-requested route via Lugna gatan and Österleden. Google Street View and the user screenshot were visual references for the separately authored entrance scenery. No Google imagery, tiles or downloaded Google 3D models are included in the game or OSM-derived database.

Existing exterior vegetation and sky retain their earlier attributions in OUTDOOR-DRIVING-MANIFEST.md and STAFF-EXIT-MANIFEST.md. Building detailing, signs, forecourt furniture and landscape dressing are authored approximations. No real elevation dataset was used.

Source building heights are used where tagged; other heights are estimated. OSM geometry is kept separate from the manually authored Street View-inspired entrance details.

