"use client";

import {
	Bell,
	Building2,
	CreditCard,
	SlidersHorizontal,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";

type SettingsTab =
	| "profile"
	| "farm"
	| "team"
	| "notify"
	| "billing"
	| "preferences";

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: typeof User }[] =
	[
		{ key: "profile", label: "Profile & account", icon: User },
		{ key: "farm", label: "Farm details", icon: Building2 },
		{ key: "team", label: "Team & roles", icon: Users },
		{ key: "notify", label: "Notifications", icon: Bell },
		{ key: "billing", label: "Billing & plan", icon: CreditCard },
		{ key: "preferences", label: "Preferences", icon: SlidersHorizontal },
	];

const TEAM = [
	{
		name: "Amina Njoroge",
		email: "amina@wakulima.co.ke",
		role: "Owner",
		owner: true,
		initials: "AN",
	},
	{
		name: "Joseph Kimani",
		email: "joseph@wakulima.co.ke",
		role: "Manager",
		owner: false,
		initials: "JK",
	},
	{
		name: "Grace Wanjiru",
		email: "grace@wakulima.co.ke",
		role: "Farm hand",
		owner: false,
		initials: "GW",
	},
	{
		name: "Dr Peter Otieno",
		email: "peter@vetlink.co.ke",
		role: "Vet · external",
		owner: false,
		initials: "PO",
	},
] as const;

const NOTIF_CATEGORIES = [
	{
		key: "pest",
		label: "Pest & disease alerts",
		app: true,
		sms: true,
		email: false,
	},
	{
		key: "inventory",
		label: "Inventory & reorder",
		app: true,
		sms: false,
		email: true,
	},
	{
		key: "finance",
		label: "Payments & finance",
		app: true,
		sms: true,
		email: true,
	},
	{
		key: "weather",
		label: "Weather warnings",
		app: true,
		sms: true,
		email: false,
	},
	{
		key: "tasks",
		label: "Task reminders",
		app: true,
		sms: false,
		email: false,
	},
	{
		key: "livestock",
		label: "Livestock health",
		app: true,
		sms: false,
		email: true,
	},
] as const;

type NotifChannel = "app" | "sms" | "email";
type NotifMatrix = Record<string, Record<NotifChannel, boolean>>;

const INITIAL_NOTIF_MATRIX: NotifMatrix = Object.fromEntries(
	NOTIF_CATEGORIES.map((c) => [
		c.key,
		{ app: c.app, sms: c.sms, email: c.email },
	]),
);

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

	const [farmName, setFarmName] = useState("Mkulima Farm");
	const [farmRegion, setFarmRegion] = useState("Nakuru");
	const [farmArea, setFarmArea] = useState("12.4 ha");
	const [farmEnterprise, setFarmEnterprise] = useState("Mixed · crops + dairy");

	const [notifMatrix, setNotifMatrix] =
		useState<NotifMatrix>(INITIAL_NOTIF_MATRIX);
	const [quietHours, setQuietHours] = useState(true);

	const toggleNotif = (category: string, channel: NotifChannel) => {
		setNotifMatrix((prev) => ({
			...prev,
			[category]: { ...prev[category], [channel]: !prev[category][channel] },
		}));
	};

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

					{tab === "farm" && (
						<>
							<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] text-base font-bold text-[#F4EAD4]">
										MK
									</div>
									<div>
										<h2 className="text-[17px] font-semibold text-[#20160F]">
											{farmName}
										</h2>
										<div className="text-xs text-[#957A5C]">
											{farmRegion} · {farmArea}
										</div>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-x-4">
									<FormField
										id="farm-name"
										label="Farm name"
										value={farmName}
										onChange={(e) => setFarmName(e.target.value)}
									/>
									<FormField
										id="farm-region"
										label="County / region"
										value={farmRegion}
										onChange={(e) => setFarmRegion(e.target.value)}
									/>
									<FormField
										id="farm-area"
										label="Total area"
										value={farmArea}
										onChange={(e) => setFarmArea(e.target.value)}
									/>
									<FormField
										id="farm-enterprise"
										label="Primary enterprise"
										value={farmEnterprise}
										onChange={(e) => setFarmEnterprise(e.target.value)}
									/>
									<FormField
										id="farm-established"
										label="Established"
										defaultValue="2014"
									/>
									<div className="mb-3.5">
										<label
											htmlFor="farm-currency"
											className="mb-[5px] block text-xs font-semibold text-[#3F2D22]"
										>
											Currency
										</label>
										<select
											id="farm-currency"
											defaultValue="KES"
											className="w-full rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
										>
											<option value="KES">KES — Kenyan Shilling</option>
										</select>
									</div>
								</div>
								<div className="mt-1.5 flex justify-end">
									<button
										type="button"
										className="rounded-[10px] bg-[#346B41] px-4 py-2.5 text-[13.5px] font-semibold text-[#F4EAD4] shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
									>
										Save farm details
									</button>
								</div>
							</div>

							<div className="rounded-2xl border border-[#E6C4B4] bg-[#FBF1EC] p-[22px]">
								<h2 className="mb-1 text-[17px] font-semibold text-[#20160F]">
									Danger zone
								</h2>
								<p className="mb-4 text-[12.5px] text-[#957A5C]">
									This affects the whole farm workspace.
								</p>
								<div className="flex items-center justify-between gap-4 border-t border-[#E6C4B4] pt-3.5">
									<div>
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											Archive this farm
										</div>
										<div className="mt-0.5 text-xs text-[#957A5C]">
											Hide it from your farms list — records are kept.
										</div>
									</div>
									<button
										type="button"
										className="rounded-[7px] border border-[#E6C4B4] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#B46038]"
									>
										Archive farm
									</button>
								</div>
							</div>
						</>
					)}

					{tab === "team" && (
						<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-[17px] font-semibold text-[#20160F]">
										Team & roles
									</h2>
									<p className="mt-1 text-[12.5px] text-[#957A5C]">
										People with access to {farmName}.
									</p>
								</div>
								<button
									type="button"
									className="rounded-[10px] bg-[#346B41] px-3.5 py-2 text-[13px] font-semibold text-[#F4EAD4]"
								>
									Invite member
								</button>
							</div>
							<div className="mt-2.5">
								{TEAM.map((member) => (
									<div
										key={member.email}
										className="flex items-center gap-3 border-t border-[#EADFCB] py-3.5 first:border-t-0"
									>
										<div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] text-[13.5px] font-bold text-[#F4EAD4]">
											{member.initials}
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-[13.5px] font-semibold text-[#20160F]">
												{member.name}
											</div>
											<div className="text-xs text-[#957A5C]">
												{member.email}
											</div>
										</div>
										<span
											className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
												member.owner
													? "bg-[#E7F0E2] text-[#2C5A38]"
													: "bg-[#F4EAD4] text-[#3F2D22]"
											}`}
										>
											{member.role}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{tab === "notify" && (
						<>
							<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
								<h2 className="mb-1 text-[17px] font-semibold text-[#20160F]">
									Notification preferences
								</h2>
								<p className="mb-4 text-[12.5px] text-[#957A5C]">
									Choose how you want to be alerted for each category.
								</p>
								<div className="grid grid-cols-[1.6fr_72px_72px_72px] gap-2 pb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-[#957A5C]">
									<div>Category</div>
									<div className="text-center">In-app</div>
									<div className="text-center">SMS</div>
									<div className="text-center">Email</div>
								</div>
								{NOTIF_CATEGORIES.map((cat) => (
									<div
										key={cat.key}
										className="grid grid-cols-[1.6fr_72px_72px_72px] items-center gap-2 border-t border-[#EADFCB] py-3.5"
									>
										<div className="text-[13px] font-semibold text-[#20160F]">
											{cat.label}
										</div>
										{(["app", "sms", "email"] as const).map((channel) => (
											<div key={channel} className="flex justify-center">
												<Switch
													checked={notifMatrix[cat.key][channel]}
													onChange={() => toggleNotif(cat.key, channel)}
													aria-label={`${cat.label} · ${channel}`}
												/>
											</div>
										))}
									</div>
								))}
							</div>
							<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
								<div className="flex items-center justify-between gap-4">
									<div>
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											Quiet hours
										</div>
										<div className="mt-0.5 text-xs text-[#957A5C]">
											Pause non-urgent alerts 21:00 – 05:00
										</div>
									</div>
									<Switch
										checked={quietHours}
										onChange={setQuietHours}
										aria-label="Quiet hours"
									/>
								</div>
							</div>
						</>
					)}

					{tab === "billing" && (
						<div className="rounded-2xl border border-[#EADFCB] bg-white p-[22px]">
							<h2 className="mb-1 text-[17px] font-semibold text-[#20160F]">
								Plan & usage
							</h2>
							<p className="mb-4 text-[12.5px] text-[#957A5C]">
								Manage your Wakulima Cloud subscription.
							</p>
							<div className="mb-1.5 flex items-center gap-4 rounded-[14px] bg-gradient-to-br from-[#2C5A38] to-[#1F3F28] p-[18px] text-[#F4EAD4]">
								<div className="flex-1">
									<div className="text-[11px] font-bold uppercase tracking-[1.2px] opacity-80">
										Current plan
									</div>
									<div className="font-serif text-[22px] font-semibold">
										Cloud Pro
									</div>
									<div className="mt-0.5 text-[12.5px] opacity-85">
										4 of 10 farms · unlimited records
									</div>
								</div>
								<div className="text-right">
									<div className="font-serif text-[22px] font-semibold">
										KES 4,500
									</div>
									<div className="text-xs opacity-85">per month</div>
								</div>
							</div>
							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Next billing date
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										1 August 2026
									</div>
								</div>
								<button
									type="button"
									className="rounded-[7px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
								>
									Change plan
								</button>
							</div>
							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Payment method
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										M-Pesa · +254 712 ••• 678
									</div>
								</div>
								<button
									type="button"
									className="rounded-[7px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
								>
									Update
								</button>
							</div>
							<div className="flex items-center justify-between gap-4 border-t border-[#EADFCB] py-3.5">
								<div>
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										Billing history
									</div>
									<div className="mt-0.5 text-xs text-[#957A5C]">
										Download past invoices
									</div>
								</div>
								<button
									type="button"
									className="rounded-[7px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
								>
									View invoices
								</button>
							</div>
						</div>
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
