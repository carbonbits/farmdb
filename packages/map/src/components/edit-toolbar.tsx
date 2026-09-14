import { useState } from "react";

// Shows while a feature is being reshaped and lets the user save or cancel. It
// owns its own busy state and the message shown when a save is refused or fails.
export function EditToolbar({
  editError,
  onSave,
  onCancel,
}: {
  editError: "forbidden" | "error" | null;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    await onSave();
    setBusy(false);
  };

  const message =
    editError === "forbidden"
      ? "You do not have permission to edit this feature."
      : editError === "error"
        ? "Could not save. Please try again."
        : null;

  return (
    <div className="absolute right-3 top-3 z-10 w-[280px] rounded-[10px] border border-[#eadfcb] bg-white p-4 shadow-lg">
      <div className="font-serif text-[15px] font-semibold text-[#20160f]">Reshape feature</div>
      <div className="mt-1 text-[12.5px] text-[#957a5c]">Drag the points to reshape, then save.</div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-md border border-[#eadfcb] py-1.5 text-[12.5px] text-[#3f2d22] hover:bg-[#f4ead4] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="flex-1 rounded-md bg-[#346b41] py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#2c5a38] disabled:opacity-60"
        >
          {busy ? "Saving" : "Save"}
        </button>
      </div>
      {message ? <div className="mt-2 text-[12px] text-[#b3261e]">{message}</div> : null}
    </div>
  );
}