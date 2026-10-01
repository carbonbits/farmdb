import { Button } from "@farmdb/ui";
import { useState } from "react";

/**
 * Starts the boundary over. Removing a saved boundary cannot be undone, so the
 * first press only asks, and the second press removes it.
 */
export function RedrawControl({
  isRemoving,
  onConfirm,
}: {
  isRemoving: boolean;
  onConfirm: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return <Button onClick={() => setIsConfirming(true)}>Redraw boundary</Button>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setIsConfirming(false)}>Keep it</Button>
      <Button variant="primary" disabled={isRemoving} onClick={onConfirm}>
        {isRemoving ? "Removing…" : "Yes, remove boundary"}
      </Button>
    </div>
  );
}
