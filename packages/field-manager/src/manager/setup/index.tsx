"use client";

import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { ArrowLeftIcon } from "@farmdb/field-manager/manager/_icons";
import { useFieldsManager } from "@farmdb/field-manager/manager/_store";
import type { SetupStep } from "@farmdb/field-manager/manager/setup/_config";
import { useBoundaryHint } from "@farmdb/field-manager/manager/setup/_hooks/use-boundary-hint";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import { FarmRecord } from "@farmdb/field-manager/manager/setup/farm-record";
import { InstallFarms } from "@farmdb/field-manager/manager/setup/install-farms";
import { StepFooter } from "@farmdb/field-manager/manager/setup/step-footer";
import { StepHeading } from "@farmdb/field-manager/manager/setup/step-heading";
import { StepPills } from "@farmdb/field-manager/manager/setup/step-pills";
import { BoundaryStep } from "@farmdb/field-manager/manager/setup/steps/boundary";
import { useCloseBoundary } from "@farmdb/field-manager/manager/setup/steps/boundary/use-close-boundary";
import { LockedStep } from "@farmdb/field-manager/manager/setup/steps/locked";
import { MembersStep } from "@farmdb/field-manager/manager/setup/steps/members";
import { Button } from "@farmdb/ui";
import { useEffect } from "react";

/**
 * The farm setup page. A farm is a boundary first, so it always opens on the
 * boundary step and keeps the later steps locked until the boundary is saved.
 * It replaces the fields list and panel while open, and closing it brings them
 * back with the selection kept.
 */
export function FarmSetup() {
  const closeBuilder = useFieldsManager((state) => state.closeBuilder);
  const step = useFarmSetup((state) => state.step);
  const goToStep = useFarmSetup((state) => state.goToStep);
  const discardDraft = useFarmSetup((state) => state.discardDraft);
  const { hasBoundary } = useFarmBoundary();
  const boundaryHint = useBoundaryHint();
  const closing = useCloseBoundary();
  const isLocked = step !== "boundary" && !hasBoundary;

  useEffect(() => {
    goToStep("boundary");
  }, [goToStep]);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-linen text-bark">
      <div className="mx-auto w-full max-w-[1160px] px-6 pt-6 pb-10">
        <button
          type="button"
          onClick={closeBuilder}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-fern hover:text-forest"
        >
          <ArrowLeftIcon />
          Back to field map
        </button>

        <header className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[700px]">
            <h1 className="font-serif text-[26px] font-semibold tracking-[-0.3px]">Farm setup</h1>
            <p className="mt-1 text-[13px] leading-[1.5] text-umber">
              A farm is a boundary first. Fields, herds, crops and every record on this install hang
              off that outline — subdivide it as finely as you need.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={discardDraft}>Discard draft</Button>
            <Button onClick={closeBuilder}>Close</Button>
          </div>
        </header>

        <StepPills activeStep={step} hasBoundary={hasBoundary} onSelect={goToStep} />

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <section className="rounded-[12px] border border-parchment bg-white p-5">
              <StepHeading step={step} />
              {isLocked ? (
                <LockedStep onGoToBoundary={() => goToStep("boundary")} />
              ) : (
                <StepBody step={step} />
              )}
            </section>
            <StepFooter
              step={step}
              hasBoundary={hasBoundary}
              hint={step === "boundary" ? boundaryHint : undefined}
              boundaryClosing={{
                isSaving: closing.isSaving,
                error: closing.error,
                onClose: closing.closeBoundary,
              }}
              onGoToStep={goToStep}
            />
          </div>
          <aside className="flex flex-col gap-4">
            <FarmRecord />
            <InstallFarms />
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepBody({ step }: { step: SetupStep }) {
  if (step === "boundary") return <BoundaryStep />;
  if (step === "members") return <MembersStep />;
  return null;
}
