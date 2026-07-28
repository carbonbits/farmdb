"use client";

import {
	ArrowDownLeft,
	ArrowUpRight,
	Banknote,
	FileText,
	HandCoins,
	UserPlus,
	X,
} from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/pill";

const QUICK_ACTIONS = [
	{
		icon: Banknote,
		label: "Record deposit",
		sub: "Savings, shares or milk income",
	},
	{
		icon: HandCoins,
		label: "Issue advance",
		sub: "Against milk income or shares",
	},
	{
		icon: ArrowUpRight,
		label: "Run payout",
		sub: "Milk income to member accounts",
	},
	{
		icon: FileText,
		label: "Export ledger",
		sub: "CSV for audit or AGM reporting",
	},
] as const;

const STATS = [
	{ v: "312", l: "Active members" },
	{ v: "KES 6.1M", l: "Total member shares" },
	{ v: "KES 184,000", l: "Advances outstanding" },
	{ v: "KES 1.9M", l: "Payouts this month" },
];

const CHIPS = ["All", "Active", "Dormant", "Flagged"] as const;

const MEMBERS = [
	{
		name: "Amina Njoroge",
		acct: "NDC-00142",
		type: "Savings",
		balance: "KES 84,200",
		status: "Active",
		statusTone: "ok" as const,
		initials: "AN",
	},
	{
		name: "Joseph Kimani",
		acct: "NDC-00098",
		type: "Shares",
		balance: "KES 41,500",
		status: "Active",
		statusTone: "ok" as const,
		initials: "JK",
	},
	{
		name: "Grace Wanjiru",
		acct: "NDC-00211",
		type: "Savings",
		balance: "KES 12,900",
		status: "Active",
		statusTone: "ok" as const,
		initials: "GW",
	},
	{
		name: "Samuel Njoroge",
		acct: "NDC-00076",
		type: "Savings",
		balance: "KES 3,100",
		status: "Dormant",
		statusTone: "neutral" as const,
		initials: "SN",
	},
	{
		name: "Rift Highlands Ltd",
		acct: "NDC-00305",
		type: "Shares",
		balance: "KES 210,000",
		status: "Active",
		statusTone: "ok" as const,
		initials: "RH",
	},
	{
		name: "Mavuno Group",
		acct: "NDC-00027",
		type: "Savings",
		balance: "− KES 4,500",
		status: "Flagged",
		statusTone: "high" as const,
		initials: "MG",
	},
];

const ACTIVITY = [
	{
		title: "Milk payout — July round 1",
		who: "312 members",
		time: "8 Jul",
		amount: "− KES 1,240,000",
		dir: "dr" as const,
	},
	{
		title: "Savings deposit",
		who: "Amina Njoroge",
		time: "6 Jul",
		amount: "+ KES 5,000",
		dir: "cr" as const,
	},
	{
		title: "Share capital contribution",
		who: "Rift Highlands Ltd",
		time: "4 Jul",
		amount: "+ KES 20,000",
		dir: "cr" as const,
	},
	{
		title: "Advance disbursed",
		who: "Mavuno Group",
		time: "2 Jul",
		amount: "− KES 15,000",
		dir: "dr" as const,
	},
	{
		title: "Milk payout — June round 2",
		who: "308 members",
		time: "24 Jun",
		amount: "− KES 1,180,000",
		dir: "dr" as const,
	},
];

const PENDING_ADVANCES = [
	{
		name: "Samuel Njoroge",
		amount: "KES 8,000",
		against: "Against next milk payout",
		initials: "SN",
	},
	{
		name: "Grace Wanjiru",
		amount: "KES 5,500",
		against: "Against savings balance",
		initials: "GW",
	},
];

export default function CoopPage() {
	const [chip, setChip] = useState<(typeof CHIPS)[number]>("All");
	const members =
		chip === "All" ? MEMBERS : MEMBERS.filter((m) => m.status === chip);

	return (
		<div className="p-8">
			<div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
				<p className="max-w-[540px] text-[13px] text-[#75583F]">
					Treasury and member accounts for the cooperative — savings, shares,
					milk income and advances, managed like a member bank.
				</p>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="flex items-center gap-2 rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
					>
						<UserPlus size={16} aria-hidden="true" />
						New member
					</button>
					<button
						type="button"
						className="flex items-center gap-2 rounded-[10px] bg-[#346B41] px-4 py-2.5 text-[13.5px] font-semibold text-[#F4EAD4]"
					>
						Run payout
					</button>
				</div>
			</div>

			<div className="mb-4 grid grid-cols-[1.6fr_1fr] gap-4">
				<div className="flex min-h-[200px] flex-col justify-between rounded-[18px] bg-gradient-to-br from-[#22372C] via-[#2C5A38] to-[#3B6B46] p-6 text-[#EEF3EA]">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-xs tracking-[0.4px] text-[#A9C2AD]">
								POOLED COOPERATIVE ACCOUNT
							</div>
							<div className="mt-1 font-serif text-[38px] font-semibold leading-none">
								KES 8,940,220
							</div>
						</div>
						<span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs tracking-wider text-[#BCD2BF]">
							•••• 4021
						</span>
					</div>
					<div>
						<div className="max-w-[340px] text-[12.5px] text-[#C7DACB]">
							Nakuru DFCS treasury float · settles member payouts and advances
						</div>
						<div className="mt-4 flex gap-[22px]">
							<div>
								<div className="text-[11px] text-[#A9C2AD]">
									In · this month
								</div>
								<div className="mt-0.5 text-[14.5px] font-bold text-[#BFE6C6]">
									+KES 2.10M
								</div>
							</div>
							<div>
								<div className="text-[11px] text-[#A9C2AD]">
									Out · this month
								</div>
								<div className="mt-0.5 text-[14.5px] font-bold text-[#F2CDB4]">
									−KES 1.72M
								</div>
							</div>
							<div>
								<div className="text-[11px] text-[#A9C2AD]">Reserve ratio</div>
								<div className="mt-0.5 text-[14.5px] font-bold">18%</div>
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="mb-1 text-base font-semibold text-[#20160F]">
						Quick actions
					</div>
					<div className="mt-1 flex flex-col gap-2">
						{QUICK_ACTIONS.map((action) => (
							<button
								key={action.label}
								type="button"
								className="flex w-full items-center gap-3 rounded-xl border border-[#EADFCB] bg-white px-3.5 py-3 text-left text-[#20160F] hover:border-[#B49A78] hover:bg-[#FCF8F0]"
							>
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F4EAD4] text-[#3F2D22]">
									<action.icon size={18} aria-hidden="true" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[13.5px] font-semibold">
										{action.label}
									</div>
									<div className="text-xs text-[#957A5C]">{action.sub}</div>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="mb-4 grid grid-cols-4 gap-4">
				{STATS.map((stat) => (
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

			<div className="grid grid-cols-[1.55fr_1fr] items-start gap-4">
				<div className="rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="text-base font-semibold text-[#20160F]">
							Member accounts
						</div>
						<span className="font-mono text-[11px] text-[#957A5C]">
							{MEMBERS.length} members
						</span>
					</div>
					<div className="my-3.5 flex flex-wrap gap-2">
						{CHIPS.map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => setChip(c)}
								className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
									chip === c
										? "border-[#346B41] bg-[#346B41] text-[#F4EAD4]"
										: "border-[#EADFCB] bg-white text-[#75583F]"
								}`}
							>
								{c}
							</button>
						))}
					</div>
					<div className="grid grid-cols-[2.1fr_1fr_1.1fr_auto] gap-3 pb-2.5 text-[10px] font-bold uppercase tracking-[0.8px] text-[#957A5C]">
						<div>Member</div>
						<div>Account</div>
						<div className="text-right">Balance</div>
						<div className="justify-self-end">Status</div>
					</div>
					{members.map((m) => (
						<div
							key={m.acct}
							className="grid grid-cols-[2.1fr_1fr_1.1fr_auto] items-center gap-3 border-t border-[#EADFCB] py-3.5"
						>
							<div className="flex min-w-0 items-center gap-2.5">
								<div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] text-[13px] font-bold text-[#F4EAD4]">
									{m.initials}
								</div>
								<div className="min-w-0">
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										{m.name}
									</div>
									<div className="font-mono text-[11.5px] text-[#957A5C]">
										{m.acct}
									</div>
								</div>
							</div>
							<div>
								<span className="rounded-full bg-[#F4EAD4] px-2.5 py-1 text-[11.5px] font-semibold text-[#3F2D22]">
									{m.type}
								</span>
							</div>
							<div className="text-right text-sm font-bold text-[#20160F]">
								{m.balance}
							</div>
							<div className="justify-self-end">
								<Pill tone={m.statusTone}>{m.status}</Pill>
							</div>
						</div>
					))}
				</div>

				<div className="flex flex-col gap-4">
					<div className="rounded-2xl border border-[#EADFCB] bg-white p-5">
						<div className="mb-1 flex items-center justify-between">
							<div className="text-base font-semibold text-[#20160F]">
								Recent activity
							</div>
							<button
								type="button"
								className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
							>
								Statement
							</button>
						</div>
						{ACTIVITY.map((txn) => (
							<div
								key={`${txn.title}-${txn.time}`}
								className="flex items-center gap-3 border-t border-[#EADFCB] py-3 first:border-t-0"
							>
								<div
									className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] ${
										txn.dir === "cr"
											? "bg-[#E7F0E2] text-[#2C5A38]"
											: "bg-[#F3E7DA] text-[#9C5A24]"
									}`}
								>
									{txn.dir === "cr" ? (
										<ArrowDownLeft size={18} aria-hidden="true" />
									) : (
										<ArrowUpRight size={18} aria-hidden="true" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										{txn.title}
									</div>
									<div className="text-xs text-[#957A5C]">
										{txn.who} · {txn.time}
									</div>
								</div>
								<div
									className={`whitespace-nowrap text-right text-[13.5px] font-bold ${
										txn.dir === "cr" ? "text-[#2C7A4A]" : "text-[#9C5A24]"
									}`}
								>
									{txn.amount}
								</div>
							</div>
						))}
					</div>

					<div className="rounded-2xl border border-[#EADFCB] bg-white p-5">
						<div className="mb-1 flex items-center justify-between">
							<div className="text-base font-semibold text-[#20160F]">
								Pending advances
							</div>
							<Pill tone="watch">{PENDING_ADVANCES.length}</Pill>
						</div>
						{PENDING_ADVANCES.map((p) => (
							<div
								key={p.name}
								className="flex items-center gap-2.5 border-t border-[#EADFCB] py-3 first:border-t-0"
							>
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4A8A54] to-[#2C5A38] text-[12.5px] font-bold text-[#F4EAD4]">
									{p.initials}
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[13.5px] font-semibold text-[#20160F]">
										{p.name} · {p.amount}
									</div>
									<div className="text-xs text-[#957A5C]">{p.against}</div>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										aria-label={`Decline advance for ${p.name}`}
										className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[#EADFCB] bg-white text-[#3F2D22]"
									>
										<X size={16} aria-hidden="true" />
									</button>
									<button
										type="button"
										className="rounded-[10px] bg-[#346B41] px-3 py-2 text-[12.5px] font-semibold text-[#F4EAD4]"
									>
										Approve
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
