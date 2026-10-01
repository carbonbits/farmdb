import { Notice } from "@farmdb/field-manager/manager/setup/_ui/notice";
import { Button } from "@farmdb/ui";

/** Shown in place of a step that needs the farm boundary first. */
export function LockedStep({ onGoToBoundary }: { onGoToBoundary: () => void }) {
  return (
    <Notice
      title="Boundary needed first"
      action={<Button onClick={onGoToBoundary}>Go to boundary</Button>}
    >
      Fields, paddocks and everything else are drawn inside the farm boundary, so trace and close it
      before this step.
    </Notice>
  );
}
