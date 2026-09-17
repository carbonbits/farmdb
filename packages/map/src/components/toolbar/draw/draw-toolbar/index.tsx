import type { MapLayer } from "@farmdb/map/lib/layers";

/**
 * Lists the layers a user can draw into, and shows why the last shape was
 * refused.
 */
export function DrawToolbar({
  layers,
  activeLayerId,
  saveError,
  onDraw,
  onCancel,
}: {
  layers: MapLayer[];
  activeLayerId: string | null;
  saveError: string | null;
  onDraw: (layer: MapLayer) => void;
  onCancel: () => void;
}) {
  if (layers.length === 0) return null;
  const active = layers.find((layer) => layer.id === activeLayerId) ?? null;
  return (
    <div className="w-[180px] rounded-[10px] border border-[#eadfcb] bg-white/95 p-3 shadow-md backdrop-blur">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#957a5c]">
        Draw
      </div>
      {active ? (
        <div className="flex flex-col gap-2 text-[13px] text-[#3f2d22]">
          <span>
            Drawing on <span className="font-semibold">{active.label}</span>
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#eadfcb] px-2 py-1 text-[12px] text-[#3f2d22] hover:bg-[#f4ead4]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => onDraw(layer)}
              className="rounded-md px-2 py-1 text-left text-[13px] text-[#3f2d22] hover:bg-[#f4ead4]"
            >
              + {layer.label}
            </button>
          ))}
        </div>
      )}
      {saveError ? <p className="mt-2 text-[12px] text-[#b3261e]">{saveError}</p> : null}
    </div>
  );
}