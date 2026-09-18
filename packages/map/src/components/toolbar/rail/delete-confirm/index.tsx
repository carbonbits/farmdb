/**
 * Asks the user to confirm a delete and shows why one was refused. The rail
 * owns the busy and error state; this only presents them.
 */
export function DeleteConfirm({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  error: "forbidden" | "error" | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const message =
    error === "forbidden"
      ? "You do not have permission to delete this feature."
      : error === "error"
        ? "Could not delete. Please try again."
        : null;

  return (
    <div className="w-[240px] rounded-[10px] border border-[#eadfcb] bg-white p-4 shadow-lg">
      <div className="text-[12.5px] text-[#3f2d22]">Delete this feature?</div>
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
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 rounded-md bg-[#b3261e] py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#8f1e18] disabled:opacity-60"
        >
          {busy ? "Deleting" : "Delete"}
        </button>
      </div>
      {message ? <div className="mt-2 text-[12px] text-[#b3261e]">{message}</div> : null}
    </div>
  );
}