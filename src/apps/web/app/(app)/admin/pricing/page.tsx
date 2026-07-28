"use client";

import { Bell, FileClock, Send } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/pill";
import { PriceChart } from "@/components/ui/price-chart";

const MONTH_LABELS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

type Trend = "up" | "down" | "steady";

const TREND_CLS = {
	up: "text-[#B4552A]",
	down: "text-[#2C7A4A]",
	steady: "text-[#957A5C]",
} as const;

interface Scope {
	id: string;
	name: string;
	cat: string;
	price: string;
	trend: Trend;
	trendLabel: string;
	sparkline: number[];
	driver: string;
	points: number[];
	floor: number;
	ceiling: number;
	todayIndex: number;
	peakIndex: number;
	harvestIndex?: number;
	sensitivity: string;
	base: string;
	multiplier: string;
	stakeholders: number;
	schedule: {
		date: string;
		change: string;
		note: string;
		status: "pending" | "confirmed";
	}[];
}

const SCOPES: Scope[] = [
	{
		id: "maize",
		name: "Maize",
		cat: "Grain · per connect",
		price: "KES 58",
		trend: "up",
		trendLabel: "+9% this week",
		sparkline: [40, 42, 45, 50, 58, 54],
		driver:
			"Price climbs into the pre-harvest window, then eases once new stock lands.",
		points: [40, 42, 45, 50, 58, 46],
		floor: 32,
		ceiling: 62,
		todayIndex: 5,
		peakIndex: 4,
		harvestIndex: 4,
		sensitivity: "High",
		base: "KES 38",
		multiplier: "1.5×",
		stakeholders: 14,
		schedule: [
			{
				date: "20 Jul",
				change: "Ceiling → KES 65",
				note: "Post-harvest cooldown",
				status: "pending",
			},
			{
				date: "1 Sep",
				change: "Base → KES 40",
				note: "New season baseline",
				status: "confirmed",
			},
		],
	},
	{
		id: "beans",
		name: "Beans",
		cat: "Grain · per connect",
		price: "KES 44",
		trend: "steady",
		trendLabel: "Flat this week",
		sparkline: [41, 42, 43, 44, 44, 44],
		driver:
			"Stable demand from cooperative buyers keeps this dataset near its base price.",
		points: [41, 42, 43, 44, 44, 44],
		floor: 30,
		ceiling: 50,
		todayIndex: 5,
		peakIndex: 3,
		sensitivity: "Low",
		base: "KES 40",
		multiplier: "1.1×",
		stakeholders: 9,
		schedule: [],
	},
	{
		id: "kale",
		name: "Kale",
		cat: "Vegetable · per connect",
		price: "KES 21",
		trend: "down",
		trendLabel: "−6% this week",
		sparkline: [26, 25, 24, 22, 21, 20],
		driver:
			"Continuous harvest is pushing supply up, easing price toward the floor.",
		points: [26, 25, 24, 22, 21, 20],
		floor: 18,
		ceiling: 32,
		todayIndex: 5,
		peakIndex: 0,
		sensitivity: "Medium",
		base: "KES 20",
		multiplier: "1.3×",
		stakeholders: 6,
		schedule: [
			{
				date: "15 Jul",
				change: "Floor → KES 16",
				note: "Match wholesale trend",
				status: "pending",
			},
		],
	},
];

const STATS = [
	{ v: "3", l: "Priced datasets" },
	{ v: "29", l: "Stakeholders on notice" },
	{ v: "KES 41", l: "Avg price / connect" },
	{ v: "2", l: "Changes scheduled" },
];

export default function ConnectPricingPage() {
	const [selectedId, setSelectedId] = useState("maize");
	const scope = SCOPES.find((s) => s.id === selectedId) ?? SCOPES[0];

	return (
		<div className="p-8">
			<div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
				<p className="max-w-[560px] text-[13px] text-[#75583F]">
					A semi-open marketplace: connect prices slide with season and demand.
					Adjust a rule and stakeholders are notified before it takes effect.
				</p>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="flex items-center gap-2 rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
					>
						<FileClock size={16} aria-hidden="true" />
						Change log
					</button>
					<button
						type="button"
						className="flex items-center gap-2 rounded-[10px] bg-[#346B41] px-4 py-2.5 text-[13.5px] font-semibold text-[#F4EAD4]"
					>
						Announce update
					</button>
				</div>
			</div>

			<div className="mb-5 grid grid-cols-4 gap-4">
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

			<div className="grid grid-cols-[336px_1fr] items-start gap-[18px]">
				<div>
					<div className="mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-[#957A5C]">
						Priced datasets
					</div>
					<div className="flex flex-col gap-2">
						{SCOPES.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setSelectedId(s.id)}
								className={`flex w-full items-center gap-3 rounded-[13px] border bg-white px-3.5 py-2.5 text-left ${
									s.id === selectedId ? "border-[#B49A78]" : "border-[#EADFCB]"
								}`}
							>
								<svg
									viewBox="0 0 92 30"
									className="h-[30px] w-[92px] shrink-0"
									aria-hidden="true"
								>
									<path
										d={s.sparkline
											.map(
												(v, i) =>
													`${i === 0 ? "M" : "L"} ${(i / (s.sparkline.length - 1)) * 92} ${
														30 -
														((v - Math.min(...s.sparkline)) /
															(Math.max(...s.sparkline) -
																Math.min(...s.sparkline) || 1)) *
															26 -
														2
													}`,
											)
											.join(" ")}
										fill="none"
										stroke={s.trend === "down" ? "#2C7A4A" : "#B4552A"}
										strokeWidth={2}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								<div className="min-w-0 flex-1">
									<div className="text-[13.5px] font-semibold leading-tight text-[#20160F]">
										{s.name}
									</div>
									<div className="mt-0.5 text-[11px] text-[#957A5C]">
										{s.cat}
									</div>
								</div>
								<div className="text-right">
									<div className="text-[13.5px] font-bold text-[#20160F]">
										{s.price}
									</div>
									<div
										className={`text-[11px] font-bold ${TREND_CLS[s.trend]}`}
									>
										{s.trendLabel}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<div className="rounded-2xl border border-[#EADFCB] bg-white px-5 py-[18px]">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<div className="font-serif text-[19px] font-semibold text-[#20160F]">
									{scope.name}
								</div>
								<span className={`text-xs font-bold ${TREND_CLS[scope.trend]}`}>
									{scope.trendLabel}
								</span>
							</div>
							<div className="text-right">
								<div className="font-serif text-[30px] font-semibold leading-none text-[#20160F]">
									{scope.price}
								</div>
								<div className="text-[11.5px] text-[#957A5C]">
									current · per connect / month
								</div>
							</div>
						</div>
						<p className="mb-1.5 mt-1.5 text-[12.5px] text-[#957A5C]">
							{scope.driver}
						</p>
						<PriceChart
							points={scope.points}
							labels={MONTH_LABELS}
							floor={scope.floor}
							ceiling={scope.ceiling}
							todayIndex={scope.todayIndex}
							peakIndex={scope.peakIndex}
							harvestIndex={scope.harvestIndex}
						/>
					</div>

					<div className="rounded-2xl border border-[#EADFCB] bg-white p-5">
						<div className="mb-3.5 flex items-center justify-between">
							<div className="text-base font-semibold text-[#20160F]">
								Sliding-scale controls
							</div>
							<Pill tone="neutral">{scope.sensitivity} sensitivity</Pill>
						</div>
						<div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
							<div>
								<label
									htmlFor="base-price"
									className="mb-[5px] block text-xs font-semibold text-[#3F2D22]"
								>
									Base price (off-season)
								</label>
								<input
									id="base-price"
									defaultValue={scope.base}
									className="w-full rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
								/>
							</div>
							<div>
								<label
									htmlFor="multiplier"
									className="mb-[5px] block text-xs font-semibold text-[#3F2D22]"
								>
									Seasonal multiplier at peak
								</label>
								<input
									id="multiplier"
									defaultValue={scope.multiplier}
									className="w-full rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
								/>
							</div>
							<div>
								<label
									htmlFor="floor-price"
									className="mb-[5px] block text-xs font-semibold text-[#3F2D22]"
								>
									Floor (never below)
								</label>
								<input
									id="floor-price"
									defaultValue={`KES ${scope.floor}`}
									className="w-full rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
								/>
							</div>
							<div>
								<label
									htmlFor="ceiling-price"
									className="mb-[5px] block text-xs font-semibold text-[#3F2D22]"
								>
									Ceiling (never above)
								</label>
								<input
									id="ceiling-price"
									defaultValue={`KES ${scope.ceiling}`}
									className="w-full rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F]"
								/>
							</div>
						</div>
						<div className="mt-4">
							<label
								htmlFor="sensitivity-range"
								className="mb-2.5 block text-xs font-semibold text-[#3F2D22]"
							>
								Demand sensitivity — how sharply price reacts near harvest
							</label>
							<input
								id="sensitivity-range"
								type="range"
								min={0}
								max={100}
								defaultValue={72}
								className="w-full accent-[#346B41]"
							/>
						</div>
						<div className="mt-[18px] flex flex-wrap items-center justify-between gap-3">
							<span className="text-xs text-[#957A5C]">
								Changes take effect after the notice period.
							</span>
							<div className="flex gap-2">
								<button
									type="button"
									className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
								>
									Save draft
								</button>
								<button
									type="button"
									className="rounded-[10px] bg-[#346B41] px-3.5 py-2 text-[13px] font-semibold text-[#F4EAD4]"
								>
									Schedule change
								</button>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-[#EADFCB] bg-white p-5">
						<div className="mb-3.5 flex items-center justify-between">
							<div className="text-base font-semibold text-[#20160F]">
								Scheduled changes
							</div>
							<span className="font-mono text-[11px] text-[#957A5C]">
								Notice: 14 days
							</span>
						</div>
						{scope.schedule.length > 0 ? (
							scope.schedule.map((s) => (
								<div
									key={s.date}
									className="flex items-center gap-3.5 border-t border-[#EADFCB] py-3.5 first:border-t-0"
								>
									<div className="w-24 shrink-0 font-mono text-xs font-semibold text-[#3F2D22]">
										{s.date}
									</div>
									<div className="min-w-0 flex-1">
										<div className="text-[13.5px] font-semibold text-[#20160F]">
											{s.change}
										</div>
										<div className="text-xs text-[#957A5C]">{s.note}</div>
									</div>
									<Pill tone={s.status === "confirmed" ? "ok" : "watch"}>
										{s.status}
									</Pill>
								</div>
							))
						) : (
							<p className="py-2 text-[13px] text-[#957A5C]">
								No upcoming changes — this rule holds until edited.
							</p>
						)}

						<div className="mt-3.5 flex items-center gap-3.5 rounded-[13px] border border-[#E6CFA2] bg-gradient-to-r from-[#F6EAD2] to-[#F2DFBF] px-4 py-3.5 text-[#7A5320]">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E8C98A] text-[#6D4614]">
								<Bell size={18} aria-hidden="true" />
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-[13px] font-bold">
									{scope.stakeholders} stakeholders on notice
								</div>
								<div className="text-xs text-[#8A6224]">
									Farms, buyers and agents holding this connect are notified 14
									days before any price change.
								</div>
							</div>
							<button
								type="button"
								className="ml-auto flex shrink-0 items-center gap-2 rounded-[10px] border border-[#E0C288] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#7A5320]"
							>
								<Send size={16} aria-hidden="true" />
								Notify now
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
