import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
	it("calls onChange with the flipped value on click", () => {
		const onChange = vi.fn();
		render(
			<Checkbox checked={false} onChange={onChange} label="Spray field B1" />,
		);
		fireEvent.click(
			screen.getByRole("button", { name: 'Mark "Spray field B1" as done' }),
		);
		expect(onChange).toHaveBeenCalledWith(true);
	});
});
