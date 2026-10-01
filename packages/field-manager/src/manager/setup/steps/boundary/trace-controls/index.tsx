import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import { Button } from "@farmdb/ui";

/**
 * Undo point, Clear and Close boundary, beside the trace heading. They stay
 * ready at full strength, as in the design; pressed with nothing to act on,
 * they change nothing, and closing too early explains itself instead.
 */
export function TraceControls({ isSaving, onClose }: { isSaving: boolean; onClose: () => void }) {
  const undoTracePoint = useFarmSetup((state) => state.undoTracePoint);
  const clearTrace = useFarmSetup((state) => state.clearTrace);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={undoTracePoint}>Undo point</Button>
      <Button onClick={clearTrace}>Clear</Button>
      <Button variant="primary" disabled={isSaving} onClick={onClose}>
        {isSaving ? "Saving…" : "Close boundary"}
      </Button>
    </div>
  );
}
