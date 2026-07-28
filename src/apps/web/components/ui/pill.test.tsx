import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pill } from "./pill";

describe("Pill", () => {
	it("renders its children", () => {
		render(<Pill tone="high">3</Pill>);
		expect(screen.getByText("3")).toBeInTheDocument();
	});
});
