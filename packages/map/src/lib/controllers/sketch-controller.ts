import { GREEN_DARK, WHITE } from "@farmdb/map/lib/colors";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

/**
 * Draws a shape while it is being traced: a dot at each corner, a dashed edge
 * joining them, and a light fill once there are enough corners to enclose land.
 * It sits on top of every layer and holds nothing that is saved.
 */

const SOURCE_ID = "trace-sketch";
const FILL_LAYER_ID = `${SOURCE_ID}-fill`;
const EDGE_LAYER_ID = `${SOURCE_ID}-edge`;
const CORNER_LAYER_ID = `${SOURCE_ID}-corners`;

const FILL_OPACITY = 0.18;
const EDGE_WIDTH = 2;
const EDGE_DASH = [2, 2];
const CORNER_RADIUS = 4;
// White rims keep the corners readable on any basemap.
const CORNER_RIM_WIDTH = 1.5;

const POINTS_FOR_AN_EDGE = 2;
const POINTS_FOR_AN_AREA = 3;

export function showSketch(map: MapLibreMap, points: number[][]): void {
  addSketchLayers(map);
  const source = map.getSource<GeoJSONSource>(SOURCE_ID);
  source?.setData(sketchShapes(points));
}

function addSketchLayers(map: MapLibreMap): void {
  if (map.getSource(SOURCE_ID)) return;
  map.addSource(SOURCE_ID, { type: "geojson", data: sketchShapes([]) });
  map.addLayer({
    id: FILL_LAYER_ID,
    type: "fill",
    source: SOURCE_ID,
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": GREEN_DARK, "fill-opacity": FILL_OPACITY },
  });
  map.addLayer({
    id: EDGE_LAYER_ID,
    type: "line",
    source: SOURCE_ID,
    filter: ["==", ["geometry-type"], "LineString"],
    paint: { "line-color": GREEN_DARK, "line-width": EDGE_WIDTH, "line-dasharray": EDGE_DASH },
  });
  map.addLayer({
    id: CORNER_LAYER_ID,
    type: "circle",
    source: SOURCE_ID,
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": CORNER_RADIUS,
      "circle-color": GREEN_DARK,
      "circle-stroke-color": WHITE,
      "circle-stroke-width": CORNER_RIM_WIDTH,
    },
  });
}

/** The fill, then the edge, then the corners, so the corners draw on top. */
function sketchShapes(points: number[][]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const hasArea = points.length >= POINTS_FOR_AN_AREA;
  const edgePoints = hasArea ? [...points, points[0]] : points;

  if (hasArea) {
    features.push(asFeature({ type: "Polygon", coordinates: [edgePoints] }));
  }
  if (points.length >= POINTS_FOR_AN_EDGE) {
    features.push(asFeature({ type: "LineString", coordinates: edgePoints }));
  }
  for (const point of points) {
    features.push(asFeature({ type: "Point", coordinates: point }));
  }
  return { type: "FeatureCollection", features };
}

function asFeature(geometry: GeoJSON.Geometry): GeoJSON.Feature {
  return { type: "Feature", properties: {}, geometry };
}
