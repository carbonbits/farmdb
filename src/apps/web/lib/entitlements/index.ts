export interface Entitlements {
	organization: boolean;
	platformAdmin: boolean;
}

// Placeholder entitlement source: both enterprise-only areas are unentitled by default,
// matching the Free-tier single-farm experience. Real license-key validation replaces this
// (see WKLM-102/106-108) without changing the shape callers depend on.
export function useEntitlements(): Entitlements {
	return {
		organization: false,
		platformAdmin: false,
	};
}
