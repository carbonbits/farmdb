import type { Collection, GeoFeature } from "@farmdb/geo";
import type { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import * as maplibregl from "maplibre-gl";
import { FIT_MAX_ZOOM, FIT_PADDING } from "@/app/_components/map/lib/config";
import { type MapLayer, toMapLayer } from "@/app/_components/map/lib/layers";
import {
  buildMaplibreLayers,
  clickLayerId,
  mapLayerIds,
  selectionLayerId,
} from "@/app/_components/map/lib/rendering";

/**
 * The imperative side of the map: everything done to a live maplibre instance.
 * The hook holds the react lifecycle and calls in here to attach the token,
 * load the layers the api serves, and apply the toggle state.
 */

type TokenRef = { current: string | null };
type Renderable = { collection: Collection; layer: MapLayer };

// The prefix check is the security boundary that keeps the token from ever
// reaching the basemap or any other host.
export function attachTokenToMapRequests(tokenRef: TokenRef, prefix: string) {
  return (url: string) => {
    if (tokenRef.current && url.startsWith(prefix)) {
      return { url, headers: { Authorization: `Bearer ${tokenRef.current}` } };
    }
    return { url };
  };
}

export async function loadLayers(
  map: maplibregl.Map,
  client: GeoApiClient,
  accessToken: string,
  tokenRef: TokenRef,
  onLayers: (layers: MapLayer[]) => void,
  onSelect: (feature: GeoFeature | null) => void,
): Promise<void> {
  let collections: Collection[];
  try {
    collections = await client.listCollections(accessToken);
  } catch {
    // Without the layer list there is nothing to draw, so the basemap stays.
    return;
  }

  const renderable: Renderable[] = [];
  for (const collection of collections) {
    const layer = toMapLayer(collection);
    if (layer) renderable.push({ collection, layer });
  }
  const layerList = renderable.map((entry) => entry.layer);

  const clickableLayerIds = await addLayersToMap(map, client, accessToken, renderable);
  onLayers(layerList);
  showPointerOnHover(map, clickableLayerIds);
  bindFeatureSelect(map, layerList, clickableLayerIds, client, tokenRef, onSelect);
  fitToExtents(map, collections);
}

export function applyLayerVisibility(
  map: maplibregl.Map,
  layers: MapLayer[],
  visible: Record<string, boolean>,
): void {
  for (const layer of layers) {
    const isVisible = visible[layer.id] ?? true;
    for (const id of mapLayerIds(layer)) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", isVisible ? "visible" : "none");
      }
    }
  }
}

async function addLayersToMap(
  map: maplibregl.Map,
  client: GeoApiClient,
  accessToken: string,
  renderable: Renderable[],
): Promise<string[]> {
  const clickableLayerIds: string[] = [];
  for (const { collection, layer } of renderable) {
    const tiles = await client.tileTemplate(accessToken, collection);
    if (!tiles) continue;
    map.addSource(sourceId(layer.id), { type: "vector", tiles: [tiles] });
    for (const spec of buildMaplibreLayers(layer)) {
      map.addLayer(spec);
    }
    clickableLayerIds.push(clickLayerId(layer));
  }
  return clickableLayerIds;
}

function showPointerOnHover(map: maplibregl.Map, layerIds: string[]): void {
  for (const id of layerIds) {
    map.on("mouseenter", id, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", id, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

function bindFeatureSelect(
  map: maplibregl.Map,
  layers: MapLayer[],
  clickableLayerIds: string[],
  client: GeoApiClient,
  tokenRef: TokenRef,
  onSelect: (feature: GeoFeature | null) => void,
): void {
  if (clickableLayerIds.length === 0) return;
  map.on("click", clickableLayerIds, (event) => {
    const feature = event.features?.[0];
    const featureId = feature?.properties?.id;
    const collectionId = feature?.sourceLayer;
    if (typeof featureId !== "string" || !collectionId || !tokenRef.current) return;
    highlightSelection(map, layers, featureId);
    client
      .getFeature(tokenRef.current, collectionId, featureId)
      .then(onSelect)
      // A failed load just closes the panel rather than showing a broken one.
      .catch(() => onSelect(null));
  });
}

function highlightSelection(map: maplibregl.Map, layers: MapLayer[], featureId: string): void {
  for (const layer of layers) {
    const selectionId = selectionLayerId(layer);
    if (selectionId) {
      map.setFilter(selectionId, ["==", ["get", "id"], featureId]);
    }
  }
}

function fitToExtents(map: maplibregl.Map, collections: Collection[]): void {
  const bounds = new maplibregl.LngLatBounds();
  let hasExtent = false;
  for (const collection of collections) {
    const spatial = collection.extent.spatial;
    if (!spatial) continue;
    const box = spatial.bbox[0];
    if (!box) continue;
    bounds.extend([box[0], box[1]]);
    bounds.extend([box[2], box[3]]);
    hasExtent = true;
  }
  if (!hasExtent) return;
  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 0 });
}

// The id a layer vector source is registered under.
function sourceId(layerId: string): string {
  return `src-${layerId}`;
}

// Reloads a layer vector source so a just saved feature is fetched. Reading the
// tiles from the style and setting them again drops the cached tiles.
export function reloadLayerTiles(map: maplibregl.Map, layerId: string): void {
  const id = sourceId(layerId);
  const spec = map.getStyle().sources[id];
  const source = map.getSource(id);
  if (spec && "tiles" in spec && spec.tiles && source && "setTiles" in source) {
    (source as maplibregl.VectorTileSource).setTiles(spec.tiles);
  }
}
