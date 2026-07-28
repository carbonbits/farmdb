"use client";

import { Calendar, Droplets, Sprout, Wallet } from "lucide-react";
import { useState } from "react";
import { Card, CardHead } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const KPI_ICON_BG = {
	green: "bg-[#346B41]",
	brown: "bg-[#7A5A34]",
	terra: "bg-[#B46038]",
	blue: "bg-[#4A6D7A]",
} as const;

const KPIS = [
	{
		icon: Sprout,
		bg: "green",
		value: "6",
		label: "Active fields",
		sub: "12.4 ha under management",
		subCls: "text-[#957A5C]",
	},
	{
		icon: Droplets,
		bg: "brown",
		value: "48 L",
		label: "Milk today",
		sub: "▲ 4% vs 7-day avg",
		subCls: "text-[#346B41]",
	},
	{
		icon: Calendar,
		bg: "terra",
		value: "5",
		label: "Open tasks",
		sub: "2 due today · 1 overdue",
		subCls: "text-[#B46038]",
	},
	{
		icon: Wallet,
		bg: "blue",
		value: "74,900",
		label: "Net this month (KES)",
		sub: "Income 107k · costs 32k",
		subCls: "text-[#346B41]",
	},
] as const;

const PRIORITY_DOT = {
	high: "bg-[#B46038]",
	normal: "bg-[#346B41]",
	routine: "bg-[#B49A78]",
	low: "bg-[#B9A888]",
} as const;

interface TaskRow {
	id: string;
	title: string;
	ctx: string;
	due: string;
	priority: keyof typeof PRIORITY_DOT;
	done: boolean;
}

const INITIAL_TASKS: TaskRow[] = [
	{
		id: "1",
		title: "Top-dress maize (Field A2)",
		ctx: "Fields & mapping",
		due: "Today",
		priority: "high",
		done: false,
	},
	{
		id: "2",
		title: "Move layer hens to paddock 3",
		ctx: "Livestock",
		due: "Today",
		priority: "normal",
		done: false,
	},
	{
		id: "3",
		title: "Record milk yield",
		ctx: "Livestock",
		due: "Overdue",
		priority: "high",
		done: false,
	},
];

const ACTIVITY = [
	{
		id: "1",
		text: "Logged 48 L milk from Dairy cattle",
		time: "2 hours ago",
		dot: "green",
	},
	{
		id: "2",
		text: "Applied fertilizer to Field A2",
		time: "Yesterday, 4:12 PM",
		dot: "brown",
	},
	{
		id: "3",
		text: "Recorded KES 12,000 input cost",
		time: "Yesterday, 11:03 AM",
		dot: "blue",
	},
	{
		id: "4",
		text: "Pest alert acknowledged on Field B1",
		time: "2 days ago",
		dot: "terra",
	},
] as const;

const ACTIVITY_DOT = {
	green: "bg-[#346B41]",
	brown: "bg-[#7A5A34]",
	terra: "bg-[#B46038]",
	blue: "bg-[#4A6D7A]",
} as const;

const WEEK = [
	{ day: "Wed", c: "Sunny", hi: "24°", lo: "14°" },
	{ day: "Thu", c: "Sunny", hi: "25°", lo: "15°" },
	{ day: "Fri", c: "Partly cloudy", hi: "23°", lo: "14°" },
	{ day: "Sat", c: "Light rain", hi: "21°", lo: "13°" },
	{ day: "Sun", c: "Sunny", hi: "24°", lo: "14°" },
] as const;

const ALERTS = [
	{
		id: "1",
		title: "Fall armyworm risk rising",
		sub: "Field A2 · Maize",
		tone: "high" as const,
	},
	{
		id: "2",
		title: "Low feed stock",
		sub: "Dairy concentrate · 3 days left",
		tone: "watch" as const,
	},
	{
		id: "3",
		title: "Soil test due",
		sub: "Field C2 · overdue by 2 weeks",
		tone: "watch" as const,
	},
];

const ALERT_BAR = {
	high: "bg-[#B46038]",
	watch: "bg-[#B8862B]",
} as const;

export default function DashboardPage() {
	const [tasks, setTasks] = useState(INITIAL_TASKS);

	const toggleTask = (id: string) => {
		setTasks((prev) =>
			prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
		);
	};

	return (
		<div className="p-8">
			<div className="mb-1 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-[26px] font-semibold tracking-tight text-[#20160F]">
						Habari, Amina 👋
					</h1>
					<div className="mt-0.5 text-[13.5px] text-[#75583F]">
						Wednesday, 8 July 2026 · Mkulima Farm, Nakuru · cool dry season
					</div>
				</div>
				<div className="flex items-center gap-2.5">
					<button
						type="button"
						className="rounded-[10px] border border-[#EADFCB] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#3F2D22]"
					>
						View tasks
					</button>
					<button
						type="button"
						className="flex items-center gap-2 rounded-[10px] bg-[#346B41] px-4 py-2.5 text-[13.5px] font-semibold text-[#F4EAD4]"
					>
						Log activity
					</button>
				</div>
			</div>

			<div className="mt-[18px] grid grid-cols-4 gap-4">
				{KPIS.map((kpi) => (
					<Card key={kpi.label}>
						<div className="flex flex-col gap-2.5">
							<div
								className={`flex h-[38px] w-[38px] items-center justify-center rounded-[11px] text-white ${KPI_ICON_BG[kpi.bg]}`}
							>
								<kpi.icon size={18} aria-hidden="true" />
							</div>
							<div>
								<div className="text-[27px] font-semibold leading-none text-[#20160F]">
									{kpi.value}
								</div>
								<div className="text-[12.5px] font-medium text-[#75583F]">
									{kpi.label}
								</div>
								<div className={`mt-0.5 text-xs ${kpi.subCls}`}>{kpi.sub}</div>
							</div>
						</div>
					</Card>
				))}
			</div>

			<div className="mt-[18px] grid grid-cols-[1.6fr_1fr] gap-[18px]">
				<div className="flex flex-col gap-4">
					<Card>
						<CardHead
							title="Today's tasks"
							action={
								<button
									type="button"
									className="text-[12.5px] font-semibold text-[#346B41]"
								>
									Open calendar →
								</button>
							}
						/>
						{tasks.map((task) => (
							<div
								key={task.id}
								className="flex items-center gap-3 border-t border-[#EADFCB] py-3 first:border-t-0"
							>
								<button
									type="button"
									aria-pressed={task.done}
									aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
									onClick={() => toggleTask(task.id)}
									className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
										task.done
											? "border-[#346B41] bg-[#346B41] text-white"
											: "border-[#B49A78] text-transparent"
									}`}
								>
									<svg
										className="h-3 w-3"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={3}
										aria-hidden="true"
									>
										<path d="M4 12l5 5L20 6" />
									</svg>
								</button>
								<div
									className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
								/>
								<div className="min-w-0 flex-1">
									<div
										className={`text-[13.5px] font-semibold ${
											task.done
												? "text-[#957A5C] line-through"
												: "text-[#20160F]"
										}`}
									>
										{task.title}
									</div>
									<div className="text-xs text-[#957A5C]">{task.ctx}</div>
								</div>
								<div className="text-xs font-semibold text-[#75583F]">
									{task.due}
								</div>
							</div>
						))}
					</Card>

					<Card>
						<CardHead
							title="Recent activity"
							action={
								<button
									type="button"
									className="text-[12.5px] font-semibold text-[#346B41]"
								>
									Log new →
								</button>
							}
						/>
						{ACTIVITY.map((item) => (
							<div
								key={item.id}
								className="flex items-start gap-3 border-t border-[#EADFCB] py-[11px] first:border-t-0"
							>
								<div
									className={`mt-1 h-[9px] w-[9px] shrink-0 rounded-full ${ACTIVITY_DOT[item.dot]}`}
								/>
								<div>
									<div className="text-[13px] font-medium text-[#20160F]">
										{item.text}
									</div>
									<div className="mt-px text-[11.5px] text-[#957A5C]">
										{item.time}
									</div>
								</div>
							</div>
						))}
					</Card>
				</div>

				<div className="flex flex-col gap-4">
					<Card warm>
						<CardHead
							title="Weather · Nakuru"
							action={<Pill tone="neutral">Dry season</Pill>}
						/>
						<div className="mb-3 flex items-center gap-3.5 border-b border-[#EADFCB] pb-3.5">
							<svg
								className="h-11 w-11 text-[#C98A2B]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.5}
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="4.5" />
								<path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
							</svg>
							<div>
								<div className="font-serif text-[34px] font-semibold leading-none text-[#20160F]">
									22°
								</div>
								<div className="text-xs text-[#957A5C]">
									Sunny · light NE winds · humidity 54%
								</div>
							</div>
						</div>
						{WEEK.map((w) => (
							<div
								key={w.day}
								className="flex items-center justify-between py-[7px] text-[13px]"
							>
								<span className="w-11 font-semibold text-[#20160F]">
									{w.day}
								</span>
								<span className="flex-1 text-xs text-[#957A5C]">{w.c}</span>
								<span className="font-semibold text-[#20160F]">{w.hi}</span>
								<span className="w-[34px] text-right text-xs text-[#957A5C]">
									{w.lo}
								</span>
							</div>
						))}
					</Card>

					<Card>
						<CardHead
							title="Alerts"
							action={<Pill tone="high">{ALERTS.length}</Pill>}
						/>
						{ALERTS.map((alert) => (
							<div
								key={alert.id}
								className="flex gap-3 border-t border-[#EADFCB] py-3 first:border-t-0"
							>
								<div
									className={`w-[3px] shrink-0 rounded-sm ${ALERT_BAR[alert.tone]}`}
								/>
								<div>
									<div className="text-[13px] font-semibold text-[#20160F]">
										{alert.title}
									</div>
									<div className="mt-px text-xs text-[#957A5C]">
										{alert.sub}
									</div>
								</div>
							</div>
						))}
					</Card>
				</div>
			</div>
		</div>
	);
}
