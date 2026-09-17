/**
 * Zooms the map in and out. The map itself lives in the hook, so this asks for
 * a step rather than holding the map.
 */
export function ZoomControl({
  onZoomIn,
  onZoomOut,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#eadfcb] bg-white shadow-md">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center border-b border-[#eadfcb] text-[#3f2d22] hover:bg-[#f4ead4]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center text-[#3f2d22] hover:bg-[#f4ead4]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  );
}