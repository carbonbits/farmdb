import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./nav-item";

describe("isNavItemActive", () => {
	it("matches an exact route", () => {
		expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
	});

	it("matches a nested route under the item's href", () => {
		expect(isNavItemActive("/fields/123", "/fields")).toBe(true);
	});

	it("does not match a sibling route with a shared prefix", () => {
		expect(isNavItemActive("/fields-report", "/fields")).toBe(false);
	});

	it("does not match an unrelated route", () => {
		expect(isNavItemActive("/inventory", "/fields")).toBe(false);
	});
});
