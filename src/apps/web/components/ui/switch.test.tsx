import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
	it("reflects the checked state via aria-checked", () => {
		render(
			<Switch
				checked={true}
				onChange={() => {}}
				aria-label="Two-factor authentication"
			/>,
		);
		expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
	});

	it("calls onChange with the flipped value on click", () => {
		const onChange = vi.fn();
		render(
			<Switch checked={false} onChange={onChange} aria-label="Login alerts" />,
		);
		fireEvent.click(screen.getByRole("switch"));
		expect(onChange).toHaveBeenCalledWith(true);
	});
});
