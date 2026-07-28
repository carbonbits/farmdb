import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InventoryPage from "./page";

describe("InventoryPage", () => {
	it("renders a row for each inventory item with its status", () => {
		render(<InventoryPage />);
		expect(screen.getByText("DAP fertilizer")).toBeInTheDocument();
		expect(screen.getByText("Dairy concentrate")).toBeInTheDocument();
		expect(screen.getAllByText("Reorder")).toHaveLength(2);
	});
});
