import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LivestockPage from "./page";

describe("LivestockPage", () => {
	it("renders herd summaries, milk stats, and the dairy register", () => {
		render(<LivestockPage />);
		expect(screen.getByText("Dairy cattle")).toBeInTheDocument();
		expect(
			screen.getByText("Milk production · last 7 days"),
		).toBeInTheDocument();
		expect(screen.getByText("Baraka")).toBeInTheDocument();
		expect(screen.getByText("#DC-014")).toBeInTheDocument();
	});
});
