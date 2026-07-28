import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReportsPage from "./page";

describe("ReportsPage", () => {
	it("renders all six report cards", () => {
		render(<ReportsPage />);
		expect(screen.getByText("Season summary")).toBeInTheDocument();
		expect(screen.getByText("Milk yield trend")).toBeInTheDocument();
		expect(screen.getByText("Cost per crop")).toBeInTheDocument();
		expect(screen.getByText("Export data")).toBeInTheDocument();
		expect(screen.getByText("Profit & loss")).toBeInTheDocument();
		expect(screen.getByText("Records health")).toBeInTheDocument();
	});
});
