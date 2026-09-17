import type { ImportResult } from "@farmdb/geo/types";
import { useRef, useState } from "react";
import type { MapLayer } from "@farmdb/map/lib/layers";

/**
 * Imports a GeoJSON file into a layer. A file is chosen first, then the layer
 * to place it in, so the layer list appears only while a file is waiting rather
 * than standing next to the draw panel. Shows how many features landed and
 * which were skipped. The season box appears only when a layer that varies by
 * season is on offer.
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
  onImport: (layer: MapLayer, file: File, season?: string) => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [season, setSeason] = useState("");

  if (layers.length === 0) return null;
  const hasSeasonalLayer = layers.some((layer) => layer.seasonal);

  function pickFile(): void {
    onClear();
    fileInputRef.current?.click();
  }

  function fileChosen(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setStagedFile(file);
    event.target.value = "";
  }

  function placeInLayer(layer: MapLayer): void {
    if (!stagedFile) return;
    const trimmed = season.trim();
    onImport(layer, stagedFile, trimmed);
    setStagedFile(null);
    setSeason("");
  }

  function cancel(): void {
    setStagedFile(null);
    setSeason("");
  }

  return (
    <div className="w-[180px] rounded-[10px] border border-[#eadfcb] bg-white/95 p-3 shadow-md backdrop-blur">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#957a5c]">
        Import
      </div>

      {importing ? (
        <p className="text-[13px] text-[#3f2d22]">Importing…</p>
      ) : stagedFile ? (
        <div className="flex flex-col gap-2 text-[13px] text-[#3f2d22]">
          <span>
            Import <span className="font-semibold">{stagedFile.name}</span> into
          </span>
          {hasSeasonalLayer ? (
            <input
              type="text"
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              placeholder="Season (optional)"
              aria-label="Season"
              className="w-full rounded-md border border-[#eadfcb] px-2 py-1 text-[12px] text-[#3f2d22] placeholder:text-[#a8967f]"
            />
          ) : null}
          <div className="flex flex-col gap-1">
            {layers.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => placeInLayer(layer)}
                className="rounded-md px-2 py-1 text-left text-[13px] text-[#3f2d22] hover:bg-[#f4ead4]"
              >
                {layer.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={cancel}
            className="rounded-md border border-[#eadfcb] px-2 py-1 text-[12px] text-[#3f2d22] hover:bg-[#f4ead4]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          className="w-full rounded-md px-2 py-1 text-left text-[13px] text-[#3f2d22] hover:bg-[#f4ead4]"
        >
          ↑ Import GeoJSON
        </button>
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