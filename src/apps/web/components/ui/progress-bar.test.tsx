import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./progress-bar";

describe("ProgressBar", () => {
	it("renders the fill at the given percent", () => {
		const { container } = render(<ProgressBar percent={42} />);
		const fill = container.querySelector("div > div > div");
		expect(fill).toHaveStyle({ width: "42%" });
	});

	it("clamps out-of-range percentages", () => {
		const { container } = render(<ProgressBar percent={150} />);
		const fill = container.querySelector("div > div > div");
		expect(fill).toHaveStyle({ width: "100%" });
	});
});
