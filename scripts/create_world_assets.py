"""Prepare a local dotted globe from public-domain Natural Earth land geometry."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
source = json.loads((ROOT / 'assets/world-land.geojson').read_text())
rings = []
for feature in source['features']:
    geometry = feature['geometry']
    polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
    rings.extend(polygon[0] for polygon in polygons)

def contains(lon, lat, ring):
    inside = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous[:2]
        x2, y2 = current[:2]
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            inside = not inside
        previous = current
    return inside

bounded = [(ring, min(p[0] for p in ring), max(p[0] for p in ring), min(p[1] for p in ring), max(p[1] for p in ring)) for ring in rings]
points = []
for row in range(116):
    lat = -84 + row * 1.5
    for column in range(240):
        lon = -180 + column * 1.5 + (row % 2) * .75
        if any(left <= lon <= right and bottom <= lat <= top and contains(lon, lat, ring) for ring, left, right, bottom, top in bounded):
            points.append([round(lon, 2), round(lat, 2)])
data = {'points': points, 'outlines': [[[round(p[0], 3), round(p[1], 3)] for p in ring] for ring in rings if len(ring) > 12]}
(ROOT / 'assets/world-land.js').write_text('// Natural Earth 1:110m land geometry — public domain.\nwindow.worldLand = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print(f'Prepared {len(points)} land points and {len(data["outlines"])} coastlines')
