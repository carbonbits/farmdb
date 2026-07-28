import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ConnectPricingPage from "./page";

describe("ConnectPricingPage", () => {
	it("shows Maize's detail by default", () => {
		render(<ConnectPricingPage />);
		expect(screen.getByText("Sliding-scale controls")).toBeInTheDocument();
		expect(
			screen.getByText(/Price climbs into the pre-harvest window/),
		).toBeInTheDocument();
	});

	it("switches the detail panel when a different dataset is selected", () => {
		render(<ConnectPricingPage />);
		fireEvent.click(screen.getByRole("button", { name: /Kale/ }));
		expect(
			screen.getByText(/Continuous harvest is pushing supply up/),
		).toBeInTheDocument();
	});

	it("shows the empty schedule state for a dataset with no scheduled changes", () => {
		render(<ConnectPricingPage />);
		fireEvent.click(screen.getByRole("button", { name: /Beans/ }));
		expect(
			screen.getByText("No upcoming changes — this rule holds until edited."),
		).toBeInTheDocument();
	});
});
