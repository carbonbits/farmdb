import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoopPage from "./page";

describe("CoopPage", () => {
	it("renders the pooled account hero and all members by default", () => {
		render(<CoopPage />);
		expect(screen.getByText("KES 8,940,220")).toBeInTheDocument();
		expect(screen.getByText("Amina Njoroge")).toBeInTheDocument();
		expect(screen.getByText("Mavuno Group")).toBeInTheDocument();
	});

	it("filters member accounts by status chip", () => {
		render(<CoopPage />);
		fireEvent.click(screen.getByRole("button", { name: "Flagged" }));
		expect(screen.getByText("Mavuno Group")).toBeInTheDocument();
		expect(screen.queryByText("Amina Njoroge")).toBeNull();
	});
});
