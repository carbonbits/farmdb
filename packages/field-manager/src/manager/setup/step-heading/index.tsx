import { SETUP_STEPS, type SetupStep } from "@farmdb/field-manager/manager/setup/_config";

/** The title and one-line explanation at the top of a step's card. */
export function StepHeading({ step }: { step: SetupStep }) {
  const entry = SETUP_STEPS.find((candidate) => candidate.id === step);
  if (!entry) return null;

  return (
    <header className="mb-4">
      <h2 className="font-serif text-[20px] font-semibold tracking-[-0.2px]">{entry.label}</h2>
      <p className="mt-1 text-[13px] leading-[1.5] text-umber">{entry.description}</p>
    </header>
  );
}
