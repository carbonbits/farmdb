import { useRef, useState } from "react";
import type { ImportResult } from "@farmdb/geo/types";
import type { MapLayer } from "@farmdb/map/lib/layers";

/**
 * Lists the layers a user can import a GeoJSON file into, and shows how many
 * features landed and which were skipped.
 */
export function ImportPanel({
  layers,
  importing,
  result,
  importError,
  onImport,
  onClear,
}: {
  layers: MapLayer[];
  importing: boolean;
  result: ImportResult | null;
  importError: string | null;
  onImport: (layer: MapLayer, file: File) => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingLayer, setPendingLayer] = useState<MapLayer | null>(null);

  if (layers.length === 0) return null;

  function chooseFile(layer: MapLayer): void {
    onClear();
    setPendingLayer(layer);
    fileInputRef.current?.click();
  }

  function fileChosen(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file && pendingLayer) onImport(pendingLayer, file);
    event.target.value = "";
    setPendingLayer(null);
  }

  return (
    <div className="w-[180px] rounded-[10px] border border-[#eadfcb] bg-white/95 p-3 shadow-md backdrop-blur">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#957a5c]">
        Import
      </div>

      {importing ? (
        <p className="text-[13px] text-[#3f2d22]">Importing…</p>
      ) : (
        <div className="flex flex-col gap-1">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => chooseFile(layer)}
              className="rounded-md px-2 py-1 text-left text-[13px] text-[#3f2d22] hover:bg-[#f4ead4]"
            >
              ↑ {layer.label}
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        onChange={fileChosen}
        className="hidden"
      />

      {result ? (
        <div className="mt-2 flex flex-col gap-1 text-[12px] text-[#3f2d22]">
          <span className="font-semibold">{result.imported} imported</span>
          {result.skipped.length > 0 ? (
            <>
              <span className="text-[#957a5c]">{result.skipped.length} skipped</span>
              <ul className="max-h-[120px] overflow-y-auto">
                {result.skipped.map((feature) => (
                  <li key={feature.index} className="text-[11px] text-[#b3261e]">
                    Feature {feature.index + 1}: {feature.reason}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {importError ? <p className="mt-2 text-[12px] text-[#b3261e]">{importError}</p> : null}
    </div>
  );
}