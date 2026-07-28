import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FinancesPage from "./page";

describe("FinancesPage", () => {
	it("renders KPI cards and recent transactions", () => {
		render(<FinancesPage />);
		expect(screen.getByText("Income · July")).toBeInTheDocument();
		expect(
			screen.getByText("Milk delivery — Nakuru Dairy Co-op"),
		).toBeInTheDocument();
		expect(screen.getByText("Milk cooperative")).toBeInTheDocument();
	});
});
