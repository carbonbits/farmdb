import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

describe("useSidebarCollapsed", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("defaults to expanded when nothing is persisted", () => {
		const { result } = renderHook(() => useSidebarCollapsed());
		expect(result.current.collapsed).toBe(false);
	});

	it("persists the toggled state across a fresh mount", () => {
		const { result, unmount } = renderHook(() => useSidebarCollapsed());

		act(() => {
			result.current.toggle();
		});
		expect(result.current.collapsed).toBe(true);
		unmount();

		const { result: remounted } = renderHook(() => useSidebarCollapsed());
		expect(remounted.current.collapsed).toBe(true);
	});

	it("toggling twice restores the expanded state", () => {
		const { result } = renderHook(() => useSidebarCollapsed());

		act(() => {
			result.current.toggle();
			result.current.toggle();
		});
		expect(result.current.collapsed).toBe(false);
		expect(localStorage.getItem("farmdb_sidebar_collapsed")).toBe("false");
	});
});
