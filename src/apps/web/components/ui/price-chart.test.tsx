import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceChart } from "./price-chart";

describe("PriceChart", () => {
	it("renders an accessible image with floor and ceiling labels", () => {
		render(
			<PriceChart
				points={[40, 42, 45, 50, 58, 46, 41]}
				labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
				floor={35}
				ceiling={60}
				todayIndex={6}
				peakIndex={4}
				harvestIndex={4}
			/>,
		);
		expect(screen.getByRole("img")).toBeInTheDocument();
		expect(screen.getByText("Floor KES 35")).toBeInTheDocument();
		expect(screen.getByText("Ceiling KES 60")).toBeInTheDocument();
	});
});
