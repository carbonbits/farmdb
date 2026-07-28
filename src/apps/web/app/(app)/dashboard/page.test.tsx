import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "./page";

describe("DashboardPage", () => {
	it("renders the KPI cards and today's tasks", () => {
		render(<DashboardPage />);
		expect(screen.getByText("Active fields")).toBeInTheDocument();
		expect(screen.getByText("Top-dress maize (Field A2)")).toBeInTheDocument();
	});

	it("marks a task as done when its checkbox is clicked", () => {
		render(<DashboardPage />);
		const toggle = screen.getByRole("button", {
			name: 'Mark "Top-dress maize (Field A2)" as done',
		});
		fireEvent.click(toggle);
		expect(
			screen.getByRole("button", {
				name: 'Mark "Top-dress maize (Field A2)" as not done',
			}),
		).toHaveAttribute("aria-pressed", "true");
	});
});
