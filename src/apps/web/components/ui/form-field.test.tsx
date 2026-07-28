import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";

describe("FormField", () => {
	it("associates the label with the input via id", () => {
		render(
			<FormField
				id="full-name"
				label="Full name"
				defaultValue="Amina Njoroge"
			/>,
		);
		expect(screen.getByLabelText("Full name")).toHaveValue("Amina Njoroge");
	});
});
