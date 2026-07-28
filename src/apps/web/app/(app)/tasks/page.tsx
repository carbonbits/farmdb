"use client";

import { useState } from "react";
import { Card, CardHead } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill } from "@/components/ui/pill";

const WEEK = [
	{ day: "Mon", date: 6, tasks: [] as { label: string; hi?: boolean }[] },
	{ day: "Tue", date: 7, tasks: [{ label: "Milking" }] },
	{
		day: "Wed",
		date: 8,
		tasks: [{ label: "Spray B1", hi: true }, { label: "Top-dress A2" }],
		today: true,
	},
	{ day: "Thu", date: 9, tasks: [{ label: "CDT goats", hi: true }] },
	{ day: "Fri", date: 10, tasks: [{ label: "Harvest kale" }] },
	{ day: "Sat", date: 11, tasks: [] },
	{ day: "Sun", date: 12, tasks: [] },
];

const PRIORITY_DOT = {
	high: "bg-[#B46038]",
	normal: "bg-[#346B41]",
	routine: "bg-[#B49A78]",
} as const;

interface TaskItem {
	id: string;
	title: string;
	ctx: string;
	due?: string;
	priority: keyof typeof PRIORITY_DOT;
	done: boolean;
}

const INITIAL_GROUPS: { key: string; label: string; tasks: TaskItem[] }[] = [
	{
		key: "today",
		label: "Today",
		tasks: [
			{
				id: "t1",
				title: "Spray Field B1 for aphids",
				ctx: "Fields & mapping",
				priority: "high",
				done: false,
			},
			{
				id: "t2",
				title: "Top-dress maize (Field A2)",
				ctx: "Fields & mapping",
				priority: "high",
				done: false,
			},
			{
				id: "t3",
				title: "Morning milking",
				ctx: "Livestock",
				priority: "routine",
				done: false,
			},
		],
	},
	{
		key: "week",
		label: "This week",
		tasks: [
			{
				id: "t4",
				title: "CDT vaccination — 6 goats",
				ctx: "Livestock",
				due: "Thu",
				priority: "high",
				done: false,
			},
			{
				id: "t5",
				title: "Harvest kale",
				ctx: "Crops & fields",
				due: "Fri",
				priority: "normal",
				done: false,
			},
			{
				id: "t6",
				title: "Record weekly milk totals",
				ctx: "Livestock",
				due: "Sun",
				priority: "routine",
				done: false,
			},
		],
	},
	{
		key: "later",
		label: "Later",
		tasks: [
			{
				id: "t7",
				title: "Soil test — Field C2",
				ctx: "Fields & mapping",
				due: "22 Jul",
				priority: "normal",
				done: false,
			},
			{
				id: "t8",
				title: "Order DAP fertilizer",
				ctx: "Inventory",
				due: "25 Jul",
				priority: "routine",
				done: false,
			},
		],
	},
];

export default function TasksPage() {
	const [groups, setGroups] = useState(INITIAL_GROUPS);

	const toggleTask = (groupKey: string, id: string) => {
		setGroups((prev) =>
			prev.map((g) =>
				g.key !== groupKey
					? g
					: {
							...g,
							tasks: g.tasks.map((t) =>
								t.id === id ? { ...t, done: !t.done } : t,
							),
						},
			),
		);
	};

	const openCount = groups
		.flatMap((g) => g.tasks)
		.filter((t) => !t.done).length;

	return (
		<div className="p-8">
			<Card>
				<CardHead
					title="Week of 6–12 July 2026"
					action={<Pill tone="neutral">{openCount} open tasks</Pill>}
				/>
				<div className="mb-1.5 grid grid-cols-7 gap-2">
					{WEEK.map((d) => (
						<div
							key={d.day}
							className={`min-h-[78px] rounded-xl border p-2.5 ${
								d.today
									? "border-[#346B41] bg-[#EEF4EA]"
									: "border-[#EADFCB] bg-white"
							}`}
						>
							<div className="text-[11px] font-semibold text-[#957A5C]">
								{d.day}
							</div>
							<div className="font-serif text-lg font-semibold text-[#20160F]">
								{d.date}
							</div>
							{d.tasks.map((t) => (
								<div
									key={t.label}
									className={`mt-1 truncate rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${
										t.hi
											? "bg-[#F5E2D6] text-[#9C4A24]"
											: "bg-[#F4EAD4] text-[#3F2D22]"
									}`}
								>
									{t.label}
								</div>
							))}
						</div>
					))}
				</div>
			</Card>

			<div className="mt-4 grid grid-cols-3 items-start gap-4">
				{groups.map((group) => (
					<Card key={group.key}>
						<CardHead
							title={group.label}
							action={
								<Pill tone={group.key === "today" ? "high" : "neutral"}>
									{group.tasks.filter((t) => !t.done).length}
								</Pill>
							}
						/>
						{group.tasks.map((task) => (
							<div
								key={task.id}
								className="flex items-center gap-3 border-t border-[#EADFCB] py-3 first:border-t-0"
							>
								<Checkbox
									checked={task.done}
									onChange={() => toggleTask(group.key, task.id)}
									label={task.title}
								/>
								<div
									className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
								/>
								<div className="min-w-0">
									<div
										className={`text-[13.5px] font-semibold ${
											task.done
												? "text-[#957A5C] line-through"
												: "text-[#20160F]"
										}`}
									>
										{task.title}
									</div>
									<div className="text-xs text-[#957A5C]">
										{task.ctx}
										{task.due ? ` · ${task.due}` : ""}
									</div>
								</div>
							</div>
						))}
					</Card>
				))}
			</div>
		</div>
	);
}
