import { SETUP_STEPS, type SetupStep } from "@farmdb/field-manager/manager/setup/_config";

/**
 * The four setup steps as pills. The steps after the boundary are disabled
 * until the boundary is saved, because everything else sits inside it.
 */
export function StepPills({
  activeStep,
  hasBoundary,
  onSelect,
}: {
  activeStep: SetupStep;
  hasBoundary: boolean;
  onSelect: (step: SetupStep) => void;
}) {
  return (
    <ol className="mt-5 flex flex-wrap gap-2">
      {SETUP_STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isLocked = step.id !== "boundary" && !hasBoundary;
        const isDone = step.id === "boundary" && hasBoundary && !isActive;
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={isLocked}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onSelect(step.id)}
              className={[
                "inline-flex items-center gap-2 rounded-full border py-1.5 pr-[13px] pl-1.5 text-[12.5px] font-semibold",
                pillClasses({ isActive, isDone, isLocked }),
              ].join(" ")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream font-mono text-[10.5px] text-umber">
                {index + 1}
              </span>
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function pillClasses({
  isActive,
  isDone,
  isLocked,
}: {
  isActive: boolean;
  isDone: boolean;
  isLocked: boolean;
}): string {
  if (isActive) return "border-fern bg-fern text-cream";
  if (isDone) return "border-leaf/30 bg-leaf/10 text-forest";
  if (isLocked) return "cursor-not-allowed border-parchment bg-cream text-taupe";
  return "border-parchment bg-white text-soil hover:bg-cream";
}
