import type { SetupStep } from "@farmdb/field-manager/manager/setup/_config";
import { create } from "zustand";

/**
 * The farm details typed in the first step. The API has no farm record yet, so
 * they stay a draft on this screen and are never shown as saved.
 */
export type FarmDraft = { name: string; county: string; ward: string; tenure: string };

const EMPTY_DRAFT: FarmDraft = { name: "", county: "", ward: "", tenure: "" };

/**
 * Which setup step is showing, the farm details drafted so far, and the
 * corners traced for the boundary, each as [longitude, latitude]. The corners
 * are shared so the map, the farm record and the hints all show the same trace.
 */
interface FarmSetupState {
  step: SetupStep;
  draft: FarmDraft;
  tracePoints: number[][];
  goToStep: (step: SetupStep) => void;
  updateDraft: (changes: Partial<FarmDraft>) => void;
  addTracePoint: (point: number[]) => void;
  undoTracePoint: () => void;
  clearTrace: () => void;
  discardDraft: () => void;
}

export const useFarmSetup = create<FarmSetupState>((set) => ({
  step: "boundary",
  draft: EMPTY_DRAFT,
  tracePoints: [],
  goToStep: (step) => set({ step }),
  updateDraft: (changes) => set((state) => ({ draft: { ...state.draft, ...changes } })),
  addTracePoint: (point) => set((state) => ({ tracePoints: [...state.tracePoints, point] })),
  undoTracePoint: () => set((state) => ({ tracePoints: state.tracePoints.slice(0, -1) })),
  clearTrace: () => set({ tracePoints: [] }),
  discardDraft: () => set({ step: "boundary", draft: EMPTY_DRAFT, tracePoints: [] }),
}));
