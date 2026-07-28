"use client";

import { SlidersHorizontal, User } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";

type SettingsTab = "profile" | "preferences";

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: typeof User }[] =
	[
		{ key: "profile", label: "Profile & account", icon: User },
		{ key: "preferences", label: "Preferences", icon: SlidersHorizontal },
	];

function getInitials(
	name: string | null | undefined,
	email: string | null | undefined,
): string {
	const source = name || email || "?";
	return source
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export default function SettingsPage() {
	const { user } = useAuth();
	const [tab, setTab] = useState<SettingsTab>("profile");

	const [fullName, setFullName] = useState(user?.display_name ?? "");
	const [role, setRole] = useState("");
	const [email, setEmail] = useState(user?.email ?? "");
	const [phone, setPhone] = useState("");
	const [twoFactor, setTwoFactor] = useState(false);
	const [loginAlerts, setLoginAlerts] = useState(true);

	const [units, setUnits] = useState<"metric" | "imperial">("metric");
	const [language, setLanguage] = useState("English");
	const [dateFormat, setDateFormat] = useState("8 July 2026");
	const [weekStart, setWeekStart] = useState<"mon" | "sun">("mon");
	const [weeklyDigest, setWeeklyDigest] = useState(true);

	return (
		<div className="p-8">
			<h1 className="mb-6 text-2xl font-semibold text-[#20160F]">Settings</h1>

			<div className="grid grid-cols-[224px_1fr] items-start gap-6">
				<nav className="flex flex-col gap-0.5">
					{SETTINGS_TABS.map(({ key, label, icon: Icon }) => (
						<button
							key={key}
							type="button"
							onClick={() => setTab(key)}
							className={`flex w-full items-center gap-[11px] rounded-[10px] border px-3 py-2.5 text-left text-[13.5px] font-semibold ${
								tab === key
									? "border-[#EADFCB] bg-white text-[#20160F] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
									: "border-transparent text-[#75583F] hover:bg-[#F4EAD4]"
							}`}
						>
							<Icon size={18} className="shrink-0" aria-hidden="true" />
							<span>{label}</span>
						</button>
					))}
				</nav>

				<div className="flex min-w-0 flex-col gap-[18px]">
					{tab === "profile" && (
						<>
							<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
								<h2 className="mb-1 text-[17px] font-semibold text-[#20160F]">
									Your profile
								</h2>
								<p className="mb-4 text-[12.5px] text-[#957A5C]">
									Update your personal details and how teammates see you.
								</p>
								<div className="mb-[18px] flex items-center gap-4">
									<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] text-[22px] font-bold text-[#F4EAD4]">
										{getInitials(user?.display_name, user?.email)}
									</div>
									<button
										type="button"
										disabled
										title="Photo upload isn't available yet"
										className="rounded-[7px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22] disabled:cursor-not-allowed disabled:opacity-50"
									>
										Change photo
									</button>
								</div>
								<div className="grid grid-cols-2 gap-x-4">
									<FormField
										id="full-name"
										label="Full name"
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
									/>
									<FormField
										id="role"
										label="Role"
										value={role}
										onChange={(e) => setRole(e.target.value)}
										placeholder="e.g. Owner"
									/>
									<FormField
										id="email"
										label="Email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
									<FormField
										id="phone"
										label="Phone"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="e.g. +254 712 345 678"
									/>
								</div>
								<div className="mt-1.5 flex justify-end">
									<button
										type="button"
										className="rounded-[10px] bg-[#346B41] px-4 py-2.5 text-[13.5px] font-semibold text-[#F4EAD4] shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
									>
										Save changes
									</button>
								</div>
							</div>

							<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
								<h2 className="mb-1 text-[17px] font-semibold text-[#20160F]">
									Password & security
								</h2>
								<p className="mb-4 text-[12.5px] text-[#957A5C]">
									Keep your account protected.
								</p>
								<div className="flex items-center justify-between gap-4 py-3.5">
									<div>
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											Password
										</div>
										<div className="mt-0.5 text-xs text-[#957A5C]">
											Last changed 3 months ago
										</div>
									</div>
									<button
										type="button"
										disabled
										title="Password change isn't available yet"
										className="rounded-[7px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22] disabled:cursor-not-allowed disabled:opacity-50"
									>
										Change password
									</button>
								</div>
								<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
									<div>
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											Two-factor authentication
										</div>
										<div className="mt-0.5 text-xs text-[#957A5C]">
											Require an SMS code when signing in
										</div>
									</div>
									<Switch
										checked={twoFactor}
										onChange={setTwoFactor}
										aria-label="Two-factor authentication"
									/>
								</div>
								<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
									<div>
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											Login alerts
										</div>
										<div className="mt-0.5 text-xs text-[#957A5C]">
											Notify me of new device sign-ins
										</div>
									</div>
									<Switch
										checked={loginAlerts}
										onChange={setLoginAlerts}
										aria-label="Login alerts"
									/>
								</div>
							</div>
						</>
					)}

					{tab === "preferences" && (
						<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
							<h2 className="mb-1 text-[17px] font-semibold text-[#20160F]">
								Preferences
							</h2>
							<p className="mb-4 text-[12.5px] text-[#957A5C]">
								Regional and display settings for your account.
							</p>

							<div className="flex items-center justify-between gap-4 py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Measurement units
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										Area, weight and volume
									</div>
								</div>
								<SegmentedControl
									options={[
										{ value: "metric", label: "Metric" },
										{ value: "imperial", label: "Imperial" },
									]}
									value={units}
									onChange={setUnits}
									aria-label="Measurement units"
								/>
							</div>

							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Language
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										Interface language
									</div>
								</div>
								<select
									aria-label="Language"
									value={language}
									onChange={(e) => setLanguage(e.target.value)}
									className="min-w-[170px] rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
								>
									<option>English</option>
									<option>Kiswahili</option>
								</select>
							</div>

							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Date format
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										How dates are displayed
									</div>
								</div>
								<select
									aria-label="Date format"
									value={dateFormat}
									onChange={(e) => setDateFormat(e.target.value)}
									className="min-w-[170px] rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
								>
									<option>8 July 2026</option>
									<option>08/07/2026</option>
									<option>2026-07-08</option>
								</select>
							</div>

							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Start week on
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										Calendar & planner
									</div>
								</div>
								<SegmentedControl
									options={[
										{ value: "mon", label: "Monday" },
										{ value: "sun", label: "Sunday" },
									]}
									value={weekStart}
									onChange={setWeekStart}
									aria-label="Start week on"
								/>
							</div>

							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Weekly digest email
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										Summary of farm activity every Monday
									</div>
								</div>
								<Switch
									checked={weeklyDigest}
									onChange={setWeeklyDigest}
									aria-label="Weekly digest email"
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
