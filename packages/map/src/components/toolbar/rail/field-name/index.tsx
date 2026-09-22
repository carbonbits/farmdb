"use client";
import { useState } from "react";

/**
 * Names a freshly drawn field before it is saved. The rail owns the pending
 * shape and the save call; this collects a name and an optional note, and
 * shows why a save was refused.
 */
export function FieldNameDialog({
  error,
  onSave,
  onCancel,
}: {
  error: string | null;
  onSave: (name: string, description?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  async function submit(): Promise<void> {
    if (!canSave) return;
    setSaving(true);
    await onSave(name.trim(), description.trim() || undefined);
    setSaving(false);
  }

  return (
    <div className="w-[300px] rounded-[14px] border border-[#eadfcb] bg-white p-4 shadow-lg">
      <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#957a5c]">Field</div>
      <div className="mt-1 text-[15px] font-semibold text-[#3f2d22]">Name this field</div>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Field name"
        className="mt-3 w-full rounded-md border border-[#eadfcb] px-2 py-2 text-[13px] text-[#3f2d22] outline-none focus:border-[#2f5a3f]"
      />
      <input
        type="text"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Note (optional)"
        className="mt-2 w-full rounded-md border border-[#eadfcb] px-2 py-2 text-[13px] text-[#3f2d22] outline-none focus:border-[#2f5a3f]"
      />
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-md border border-[#eadfcb] py-2 text-[13px] text-[#3f2d22] hover:bg-[#f4ead4] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSave}
          className="flex-1 rounded-md bg-[#2f5a3f] py-2 text-[13px] font-semibold text-white hover:bg-[#274b34] disabled:opacity-60"
        >
          {saving ? "Saving" : "Save"}
        </button>
      </div>
      {error ? <div className="mt-2 text-[12px] text-[#b3261e]">{error}</div> : null}
    </div>
  );
}