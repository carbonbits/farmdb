import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TasksPage from "./page";

describe("TasksPage", () => {
	it("renders the week strip and the three task columns", () => {
		render(<TasksPage />);
		expect(screen.getByText("Week of 6–12 July 2026")).toBeInTheDocument();
		expect(screen.getByText("Today")).toBeInTheDocument();
		expect(screen.getByText("This week")).toBeInTheDocument();
		expect(screen.getByText("Later")).toBeInTheDocument();
		expect(screen.getByText("Spray Field B1 for aphids")).toBeInTheDocument();
	});

	it("marks a task done and updates its group's open count", () => {
		render(<TasksPage />);
		expect(screen.getByText("Today").parentElement).toHaveTextContent("3");

		fireEvent.click(
			screen.getByRole("button", {
				name: 'Mark "Spray Field B1 for aphids" as done',
			}),
		);

		expect(screen.getByText("Today").parentElement).toHaveTextContent("2");
	});
});
