import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FieldsPage from "./page";

describe("FieldsPage", () => {
	it("shows a hint and no field panel before a plot is selected", () => {
		render(<FieldsPage />);
		expect(
			screen.getByText("Tap a plot to view its soil & records"),
		).toBeInTheDocument();
		expect(screen.queryByText("Field A2")).toBeNull();
	});

	it("shows the field detail panel when a plot is clicked", () => {
		render(<FieldsPage />);
		fireEvent.click(screen.getByRole("button", { name: /A2/ }));
		expect(screen.getByText("Field A2")).toBeInTheDocument();
		expect(screen.getByText("Needs attention")).toBeInTheDocument();
	});

	it("switches the active records tab", () => {
		render(<FieldsPage />);
		fireEvent.click(screen.getByRole("button", { name: /A1/ }));
		expect(screen.queryByText("DAP fertilizer")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
		expect(screen.getByText("DAP fertilizer")).toBeInTheDocument();
	});
});
