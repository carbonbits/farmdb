import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CropsPage from "./page";

describe("CropsPage", () => {
	it("renders a card for each crop", () => {
		render(<CropsPage />);
		expect(screen.getByText("Maize")).toBeInTheDocument();
		expect(screen.getByText("Beans")).toBeInTheDocument();
		expect(screen.getByText("Kale")).toBeInTheDocument();
		expect(screen.getByText("Fallow rotation")).toBeInTheDocument();
	});
});
