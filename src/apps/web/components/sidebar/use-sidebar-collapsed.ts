import { useEffect, useState } from "react";

const STORAGE_KEY = "farmdb_sidebar_collapsed";

export function useSidebarCollapsed() {
	const [collapsed, setCollapsed] = useState(false);

	// Read persisted state after mount to avoid a hydration mismatch between the
	// static export and whatever was previously saved in this browser.
	useEffect(() => {
		setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
	}, []);

	const toggle = () => {
		setCollapsed((prev) => {
			const next = !prev;
			localStorage.setItem(STORAGE_KEY, String(next));
			return next;
		});
	};

	return { collapsed, toggle };
}
