import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

const options = [
	{ value: "metric", label: "Metric" },
	{ value: "imperial", label: "Imperial" },
] as const;

describe("SegmentedControl", () => {
	it("marks the active option as checked", () => {
		render(
			<SegmentedControl
				options={options}
				value="metric"
				onChange={() => {}}
				aria-label="Measurement units"
			/>,
		);
		expect(screen.getByRole("tab", { name: "Metric" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Imperial" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	it("calls onChange with the clicked option's value", () => {
		const onChange = vi.fn();
		render(
			<SegmentedControl
				options={options}
				value="metric"
				onChange={onChange}
				aria-label="Measurement units"
			/>,
		);
		fireEvent.click(screen.getByRole("tab", { name: "Imperial" }));
		expect(onChange).toHaveBeenCalledWith("imperial");
	});
});
