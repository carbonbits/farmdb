import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ConnectsPage from "./page";

describe("ConnectsPage", () => {
	it("shows held connects by default, including the unassigned-seat warning", () => {
		render(<ConnectsPage />);
		expect(screen.getByText("Kilele Estates")).toBeInTheDocument();
		expect(screen.getByText("Mavuno Group")).toBeInTheDocument();
		expect(screen.getByText("Seat is paid but unassigned")).toBeInTheDocument();
		expect(screen.queryByText("AgriTrace Kenya")).toBeNull();
	});

	it("switches to the granted-access tab", () => {
		render(<ConnectsPage />);
		fireEvent.click(
			screen.getByRole("button", { name: "Access to your farms" }),
		);
		expect(screen.getByText("AgriTrace Kenya")).toBeInTheDocument();
		expect(screen.getByText("AgriTrace Sync Bot")).toBeInTheDocument();
		expect(screen.queryByText("Kilele Estates")).toBeNull();
	});
});
