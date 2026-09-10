import type { GeoGeometry } from "@farmdb/geo";
import type { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { reloadLayerTiles } from "@/app/_components/map/lib/controllers/map-controller";
import type { GeometryClass, MapLayer } from "@/app/_components/map/lib/layers";

type TokenRef = { current: string | null };

// The inert mode the draw tool sits in when nothing is being drawn.
const IDLE_MODE = "static";

// A layer geometry maps to the mode that draws it.
const DRAW_MODE: Record<GeometryClass, string> = {
  polygon: "polygon",
  line: "linestring",
  point: "point",
};

/**
 * The drawing tool on the live map. The user picks a layer to draw into and a
 * finished shape becomes a saved feature. Choosing a layer chooses the mode
 * from that layer geometry, so a shape can never be the wrong kind for its
 * layer. On save the layer tiles reload so the feature shows and the temporary
 * shape is removed.
 */
export class DrawTool {
  private readonly draw: TerraDraw;
  private targetLayerId: string | null = null;

  constructor(
    private readonly map: MapLibreMap,
    private readonly client: GeoApiClient,
    private readonly tokenRef: TokenRef,
    private readonly onSaved: (layerId: string) => void,
    private readonly onError: () => void,
  ) {
    this.draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [new TerraDrawPolygonMode(), new TerraDrawPointMode(), new TerraDrawLineStringMode()],
    });
    this.draw.start();
    this.draw.on("finish", (id, context) => {
      if (context.action === "draw") this.saveDrawnShape(id);
    });
  }

  startDrawing(layer: MapLayer): void {
    this.targetLayerId = layer.id;
    this.draw.setMode(DRAW_MODE[layer.geometry]);
  }

  cancelDrawing(): void {
    this.draw.clear();
    this.draw.setMode(IDLE_MODE);
    this.targetLayerId = null;
  }

  destroy(): void {
    this.draw.stop();
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
