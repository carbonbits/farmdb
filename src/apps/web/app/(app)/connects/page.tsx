"use client";

import { Bot, MoreVertical, Plus } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/pill";

type ConnectsTab = "held" | "granted";

const EXP_TONE = {
	ok: "text-[#957A5C]",
	warn: "text-[#9C6716]",
	bad: "text-[#9C4A24]",
} as const;

const FILL_TONE = {
	ok: "bg-[#346B41]",
	warn: "bg-[#C98A2B]",
	bad: "bg-[#B4472A]",
} as const;

const STATUS_TONE = {
	ok: "ok",
	watch: "watch",
} as const;

interface Connect {
	id: string;
	farm: string;
	ownerLine: string;
	initials: string;
	status: keyof typeof STATUS_TONE;
	statusLabel: string;
	scopes: { label: string; access: string }[];
	assignee: {
		kind: "user" | "agent";
		name: string;
		tag: string;
		sub: string;
		expTone: keyof typeof EXP_TONE;
		expText: string;
	} | null;
	subscription: {
		plan: string;
		price: string;
		cycle: string;
		daysLeftPercent: number;
		expTone: keyof typeof EXP_TONE;
		daysLeftText: string;
		expText: string;
	};
}

const HELD_CONNECTS: Connect[] = [
	{
		id: "kilele",
		farm: "Kilele Estates",
		ownerLine: "Kilele Estates Ltd · Laikipia",
		initials: "KE",
		status: "ok",
		statusLabel: "Active",
		scopes: [
			{ label: "Livestock", access: "View" },
			{ label: "Milk records", access: "View + export" },
		],
		assignee: {
			kind: "user",
			name: "Grace Wanjiru",
			tag: "Teammate",
			sub: "grace@wakulima.co.ke",
			expTone: "ok",
			expText: "in 45 days",
		},
		subscription: {
			plan: "Connect Basic",
			price: "KES 1,200",
			cycle: "per month",
			daysLeftPercent: 40,
			expTone: "warn",
			daysLeftText: "12 days left",
			expText: "Renews 20 Jul 2026",
		},
	},
	{
		id: "mavuno",
		farm: "Mavuno Group",
		ownerLine: "Mavuno Group · Bomet",
		initials: "MG",
		status: "ok",
		statusLabel: "Active",
		scopes: [
			{ label: "Fields", access: "View" },
			{ label: "Yields", access: "View" },
		],
		assignee: null,
		subscription: {
			plan: "Connect Pro",
			price: "KES 2,500",
			cycle: "per month",
			daysLeftPercent: 80,
			expTone: "ok",
			daysLeftText: "60 days left",
			expText: "Renews 6 Sep 2026",
		},
	},
];

const GRANTED_CONNECTS: Connect[] = [
	{
		id: "agritrace",
		farm: "AgriTrace Kenya",
		ownerLine: "Buyer network · access to Sunrise Poultry",
		initials: "AT",
		status: "watch",
		statusLabel: "Expiring soon",
		scopes: [
			{ label: "Sales records", access: "View" },
			{ label: "Inventory", access: "View" },
		],
		assignee: {
			kind: "agent",
			name: "AgriTrace Sync Bot",
			tag: "AI agent",
			sub: "Automated data sync",
			expTone: "ok",
			expText: "in 90 days",
		},
		subscription: {
			plan: "Buyer Connect",
			price: "KES 3,000",
			cycle: "per month",
			daysLeftPercent: 8,
			expTone: "bad",
			daysLeftText: "5 days left",
			expText: "Renews 13 Jul 2026",
		},
	},
];

export default function ConnectsPage() {
	const [tab, setTab] = useState<ConnectsTab>("held");
	const connects = tab === "held" ? HELD_CONNECTS : GRANTED_CONNECTS;

	const stats = [
		{
			v: String(HELD_CONNECTS.length + GRANTED_CONNECTS.length),
			l: "Active connects",
		},
		{
			v: String(HELD_CONNECTS.filter((c) => !c.assignee).length),
			l: "Seats unassigned",
		},
		{ v: "KES 6,700", l: "Total per month" },
		{ v: "2", l: "Expiring within 14 days" },
	];

	return (
		<div className="p-8">
			<div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
				<p className="max-w-[520px] text-[13px] text-[#75583F]">
					Connects let people and AI agents in Njoroge Holdings reach specific
					farm datasets. Each seat can be assigned to a teammate or an agent,
					and expires by assignment and by subscription.
				</p>
				<button
					type="button"
					className="flex items-center gap-2 rounded-[10px] bg-[#346B41] px-4 py-2.5 text-[13.5px] font-semibold text-[#F4EAD4]"
				>
					<Plus size={16} aria-hidden="true" />
					{tab === "held" ? "New connect" : "Invite party"}
				</button>
			</div>

			<div className="mb-[18px] grid grid-cols-4 gap-4">
				{stats.map((stat) => (
					<div
						key={stat.l}
						className="rounded-2xl border border-[#EADFCB] bg-white px-[18px] py-4"
					>
						<div className="font-serif text-2xl font-semibold leading-tight text-[#20160F]">
							{stat.v}
						</div>
						<div className="mt-1 text-xs text-[#957A5C]">{stat.l}</div>
					</div>
				))}
			</div>

			<div className="mb-[18px] inline-flex w-max max-w-full gap-1 rounded-xl bg-[#F4EAD4] p-1">
				<button
					type="button"
					onClick={() => setTab("held")}
					className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${
						tab === "held"
							? "bg-white text-[#20160F] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
							: "text-[#75583F]"
					}`}
				>
					Connects you hold
				</button>
				<button
					type="button"
					onClick={() => setTab("granted")}
					className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${
						tab === "granted"
							? "bg-white text-[#20160F] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
							: "text-[#75583F]"
					}`}
				>
					Access to your farms
				</button>
			</div>

			<div className="flex flex-col gap-4">
				{connects.map((c) => (
					<div
						key={c.id}
						className="overflow-hidden rounded-2xl border border-[#EADFCB] bg-white"
					>
						<div className="flex items-center gap-3.5 px-5 pb-3.5 pt-[18px]">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] text-[15px] font-bold text-[#F4EAD4]">
								{c.initials}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-2">
									<div className="font-serif text-[17px] font-semibold text-[#20160F]">
										{c.farm}
									</div>
									<Pill tone={STATUS_TONE[c.status]}>{c.statusLabel}</Pill>
								</div>
								<div className="text-[12.5px] text-[#957A5C]">
									{c.ownerLine}
								</div>
							</div>
							<button
								type="button"
								aria-label={`More actions for ${c.farm}`}
								className="flex h-9 w-9 items-center justify-center rounded-lg text-[#75583F] hover:bg-[#F4EAD4]"
							>
								<MoreVertical size={18} aria-hidden="true" />
							</button>
						</div>

						<div className="px-5 pb-[18px]">
							<div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.8px] text-[#957A5C]">
								Shared scopes
							</div>
							<div className="flex flex-wrap gap-1.5">
								{c.scopes.map((scope) => (
									<span
										key={scope.label}
										className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#EADFCB] bg-[#F4EAD4] px-2.5 py-1 text-xs font-semibold text-[#3F2D22]"
									>
										{scope.label}
										<span className="rounded border border-[#EADFCB] bg-white px-1 text-[9.5px] font-bold uppercase tracking-[0.4px] text-[#957A5C]">
											{scope.access}
										</span>
									</span>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 border-t border-[#EADFCB]">
							<div className="p-5">
								<div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.8px] text-[#957A5C]">
									Assigned to
								</div>
								{c.assignee ? (
									<>
										<div className="flex items-center gap-2.5">
											<div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] font-serif text-sm font-bold text-[#F4EAD4]">
												{c.assignee.kind === "agent" ? (
													<Bot size={18} aria-hidden="true" />
												) : (
													c.assignee.name
														.split(" ")
														.map((p) => p[0])
														.slice(0, 2)
														.join("")
												)}
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<div className="text-[13.5px] font-semibold text-[#20160F]">
														{c.assignee.name}
													</div>
													<span className="rounded-full bg-[#F4EAD4] px-2 py-0.5 text-[10.5px] font-bold text-[#3F2D22]">
														{c.assignee.tag}
													</span>
												</div>
												<div className="text-xs text-[#957A5C]">
													{c.assignee.sub}
												</div>
											</div>
										</div>
										<div
											className={`mt-2.5 text-xs ${EXP_TONE[c.assignee.expTone]}`}
										>
											Assignment expires {c.assignee.expText}
										</div>
										<div className="mt-3.5 flex flex-wrap gap-2">
											<button
												type="button"
												className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
											>
												Reassign
											</button>
											<button
												type="button"
												className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
											>
												Edit scopes
											</button>
										</div>
									</>
								) : (
									<>
										<button
											type="button"
											className="flex w-full items-center gap-2.5 rounded-[11px] border-[1.5px] border-dashed border-[#B49A78] px-3.5 py-3 text-left text-[13px] font-semibold text-[#3F2D22]"
										>
											Assign to a user or AI agent
										</button>
										<div className="mt-2.5 text-xs text-[#9C6716]">
											Seat is paid but unassigned
										</div>
									</>
								)}
							</div>
							<div className="border-l border-[#EADFCB] p-5">
								<div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.8px] text-[#957A5C]">
									Subscription
								</div>
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0">
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											{c.subscription.plan}
										</div>
										<div className="text-xs text-[#957A5C]">
											{c.subscription.price} {c.subscription.cycle}
										</div>
									</div>
									<div className="text-right">
										<div
											className={`text-[12.5px] font-bold ${EXP_TONE[c.subscription.expTone]}`}
										>
											{c.subscription.daysLeftText}
										</div>
										<div className="text-[11.5px] text-[#957A5C]">
											{c.subscription.expText}
										</div>
									</div>
								</div>
								<div className="mt-2.5 h-1.5 overflow-hidden rounded-md bg-[#F4EAD4]">
									<div
										className={`h-full rounded-md ${FILL_TONE[c.subscription.expTone]}`}
										style={{ width: `${c.subscription.daysLeftPercent}%` }}
									/>
								</div>
								<div className="mt-3.5">
									<button
										type="button"
										className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
									>
										{tab === "held" ? "Change plan" : "View agreement"}
									</button>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
