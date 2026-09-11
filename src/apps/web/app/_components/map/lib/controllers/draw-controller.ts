import type { GeoFeature, GeoGeometry } from "@farmdb/geo";
import type { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import { GeoApiError } from "@farmdb/geo/utils/errors/geo_api";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { reloadLayerTiles } from "@/app/_components/map/lib/controllers/map-controller";
import type { GeometryClass, MapLayer } from "@/app/_components/map/lib/layers";
import { mapLayerIds, selectionLayerId } from "@/app/_components/map/lib/rendering";

type TokenRef = { current: string | null };
type Editing = { terraId: string | number; featureId: string; layer: MapLayer };

// The geometries terra-draw can reshape: the single kinds, never the multi ones.
type EditableGeometry = Extract<GeoGeometry, { type: "Polygon" | "LineString" | "Point" }>;

// The inert mode the draw tool sits in when nothing is being drawn or edited.
const IDLE_MODE = "static";

// The mode that lets the user drag an existing shape's points to reshape it.
const SELECT_MODE = "select";

// A layer geometry maps to the mode that draws it.
const DRAW_MODE: Record<GeometryClass, string> = {
  polygon: "polygon",
  line: "linestring",
  point: "point",
};

// A stored geometry type maps to the mode that can reshape it. Multi geometries
// are absent, so a shape we cannot cleanly edit never enters edit mode.
const EDIT_MODE: Record<string, string> = {
  Polygon: "polygon",
  LineString: "linestring",
  Point: "point",
};

/**
 * The drawing tool on the live map. The user either draws a new shape into a
 * layer or reshapes an existing feature. A finished drawing becomes a saved
 * feature; a reshape saves through the feature update path when the user
 * confirms. While a feature is being reshaped its tile copy is hidden so only
 * the draggable copy shows. On save the layer tiles reload so the change shows
 * and the temporary shape is removed. Terra-draw owns its own feature ids, so
 * an edit keeps a small mapping back to our feature id to save against.
 */
export class DrawTool {
  private readonly draw: TerraDraw;
  private targetLayerId: string | null = null;
  private editing: Editing | null = null;

  constructor(
    private readonly map: MapLibreMap,
    private readonly client: GeoApiClient,
    private readonly tokenRef: TokenRef,
    private readonly onSaved: (layerId: string) => void,
    private readonly onError: () => void,
  ) {
    this.draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawPolygonMode(),
        new TerraDrawPointMode(),
        new TerraDrawLineStringMode(),
        new TerraDrawSelectMode({
          flags: {
            polygon: {
              feature: {
                draggable: true,
                coordinates: { midpoints: true, draggable: true, deletable: true },
              },
            },
            linestring: {
              feature: {
                draggable: true,
                coordinates: { midpoints: true, draggable: true, deletable: true },
              },
            },
            point: { feature: { draggable: true } },
          },
        }),
      ],
    });
    this.draw.start();
    this.draw.on("finish", (id, context) => {
      if (context.action === "draw") this.saveDrawnShape(id);
    });
  }

  startDrawing(layer: MapLayer): void {
    this.reset();
    this.targetLayerId = layer.id;
    this.draw.setMode(DRAW_MODE[layer.geometry]);
  }

  cancelDrawing(): void {
    this.reset();
  }

  startEditing(feature: GeoFeature, layer: MapLayer): void {
    this.reset();
    const mode = EDIT_MODE[feature.geometry.type];
    if (!mode) return;

    this.draw.addFeatures([
      { type: "Feature", geometry: feature.geometry as EditableGeometry, properties: { mode } },
    ]);
    const [loaded] = this.draw.getSnapshot();
    if (!loaded || loaded.id === undefined) return;

    this.editing = { terraId: loaded.id, featureId: feature.id, layer };
    this.hideFeature(layer, feature.id);
    this.draw.setMode(SELECT_MODE);
    this.draw.selectFeature(loaded.id);
  }

  async saveEdit(): Promise<"ok" | "forbidden" | "error"> {
    const editing = this.editing;
    const token = this.tokenRef.current;
    if (!editing || !token) return "error";

    const shape = this.draw.getSnapshot().find((feature) => feature.id === editing.terraId);
    if (!shape) return "error";

    try {
      await this.client.updateFeature(token, editing.layer.id, editing.featureId, {
        geometry: shape.geometry as GeoGeometry,
      });
      const layerId = editing.layer.id;
      this.reset();
      reloadLayerTiles(this.map, layerId);
      return "ok";
    } catch (error) {
      return error instanceof GeoApiError && error.status === 403 ? "forbidden" : "error";
    }
  }

  cancelEditing(): void {
    this.reset();
  }

  destroy(): void {
    this.draw.stop();
  }

  private reset(): void {
    if (this.editing) this.showLayer(this.editing.layer);
    this.draw.clear();
    this.draw.setMode(IDLE_MODE);
    this.targetLayerId = null;
    this.editing = null;
  }

  // Hides the feature being edited on its layer, and clears any highlight, so
  // only the draggable copy shows while reshaping.
  private hideFeature(layer: MapLayer, featureId: string): void {
    const selectionId = selectionLayerId(layer);
    for (const id of mapLayerIds(layer)) {
      if (!this.map.getLayer(id)) continue;
      if (id === selectionId) {
        this.map.setFilter(id, ["==", ["get", "id"], ""]);
      } else {
        this.map.setFilter(id, ["!=", ["get", "id"], featureId]);
      }
    }
  }

  // Shows every feature on a layer again after a reshape ends.
  private showLayer(layer: MapLayer): void {
    const selectionId = selectionLayerId(layer);
    for (const id of mapLayerIds(layer)) {
      if (id !== selectionId && this.map.getLayer(id)) {
        this.map.setFilter(id, null);
      }
    }
  }

  private saveDrawnShape(id: string | number): void {
    const layerId = this.targetLayerId;
    const token = this.tokenRef.current;
    this.draw.setMode(IDLE_MODE);
    this.targetLayerId = null;

    const feature = this.draw.getSnapshot().find((shape) => shape.id === id);
    if (!feature || !layerId || !token) {
      this.draw.removeFeatures([id]);
      return;
    }

    this.client
      .createFeature(token, layerId, { geometry: feature.geometry as GeoGeometry })
      .then(() => {
        this.draw.removeFeatures([id]);
        reloadLayerTiles(this.map, layerId);
        this.onSaved(layerId);
      })
      .catch(() => this.onError());
  }
}