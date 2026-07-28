import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "@/lib/auth";
import SettingsPage from "./page";

function renderSettingsPage() {
	return render(
		<AuthProvider>
			<SettingsPage />
		</AuthProvider>,
	);
}

describe("SettingsPage", () => {
	it("shows the Profile & account tab by default", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);
		expect(screen.getByText("Password & security")).toBeInTheDocument();
		expect(
			screen.queryByText("Regional and display settings for your account."),
		).toBeNull();
	});

	it("switches to the Preferences tab", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole("button", { name: "Preferences" }));

		expect(
			screen.getByText("Regional and display settings for your account."),
		).toBeInTheDocument();
		expect(screen.queryByText("Your profile")).toBeNull();
	});

	it("toggles the two-factor authentication switch", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);

		const toggle = screen.getByRole("switch", {
			name: "Two-factor authentication",
		});
		expect(toggle).toHaveAttribute("aria-checked", "false");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-checked", "true");
	});

	it("shows the Farm details tab with its danger zone", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole("button", { name: "Farm details" }));

		expect(screen.getByText("Danger zone")).toBeInTheDocument();
		expect(screen.getByLabelText("Farm name")).toHaveValue("Mkulima Farm");
	});

	it("shows the Team & roles tab with team members", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole("button", { name: "Team & roles" }));

		expect(screen.getByText("Amina Njoroge")).toBeInTheDocument();
		expect(screen.getByText("Owner")).toBeInTheDocument();
	});

	it("toggles a cell in the notifications matrix", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

		const toggle = screen.getByRole("switch", {
			name: "Pest & disease alerts · email",
		});
		expect(toggle).toHaveAttribute("aria-checked", "false");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-checked", "true");
	});

	it("shows the Billing & plan tab", async () => {
		renderSettingsPage();
		await waitFor(() =>
			expect(screen.getByText("Your profile")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole("button", { name: "Billing & plan" }));

		expect(screen.getByText("Cloud Pro")).toBeInTheDocument();
	});
});
