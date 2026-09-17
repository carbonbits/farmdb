import type { MapLayer } from "@farmdb/map/lib/layers";

/**
 * Shows every layer with a checkbox and turns each one on or off.
 */
export function LayerToggle({
  layers,
  visible,
  onChange,
}: {
  layers: MapLayer[];
  visible: Record<string, boolean>;
  onChange: (layerId: string, on: boolean) => void;
}) {
  if (layers.length === 0) return null;
  return (
    <div className="w-[180px] rounded-[10px] border border-[#eadfcb] bg-white/95 p-3 shadow-md backdrop-blur">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#957a5c]">
        Layers
      </div>
      {layers.map((layer) => (
        <label
          key={layer.id}
          className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-[#3f2d22]"
        >
          <input
            type="checkbox"
            checked={visible[layer.id] ?? true}
            onChange={(event) => onChange(layer.id, event.target.checked)}
          />
          <span>{layer.label}</span>
        </label>
      ))}
    </div>
  );
}