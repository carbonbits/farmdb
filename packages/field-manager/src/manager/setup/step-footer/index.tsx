import { SETUP_STEPS, type SetupStep } from "@farmdb/field-manager/manager/setup/_config";
import { Button } from "@farmdb/ui";

/** Closing the boundary from the footer: whether a save is running, and how. */
export type BoundaryClosing = {
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
};

/**
 * The actions under a step's card. Until the boundary is saved the main button
 * closes it; after that it becomes Next, and moving on is always the user's
 * choice. Back appears from the second step on.
 */
export function StepFooter({
  step,
  hasBoundary,
  hint,
  boundaryClosing,
  onGoToStep,
}: {
  step: SetupStep;
  hasBoundary: boolean;
  hint?: string;
  boundaryClosing: BoundaryClosing;
  onGoToStep: (step: SetupStep) => void;
}) {
  const stepIndex = SETUP_STEPS.findIndex((entry) => entry.id === step);
  const previousStep = SETUP_STEPS[stepIndex - 1];
  const nextStep = SETUP_STEPS[stepIndex + 1];
  const message = boundaryClosing.error ?? hint;

  return (
    <footer className="mt-4 flex flex-wrap items-center gap-3">
      {previousStep && <Button onClick={() => onGoToStep(previousStep.id)}>Back</Button>}
      {nextStep &&
        (hasBoundary ? (
          <Button variant="primary" onClick={() => onGoToStep(nextStep.id)}>
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={boundaryClosing.isSaving}
            onClick={boundaryClosing.onClose}
          >
            {boundaryClosing.isSaving ? "Saving…" : "Close the boundary to continue"}
          </Button>
        ))}
      {message && (
        <span
          role={boundaryClosing.error ? "alert" : undefined}
          className="text-[12.5px] text-umber"
        >
          {message}
        </span>
      )}
    </footer>
  );
}
