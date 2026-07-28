"use client";

import { Layers, X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type PlotId = "a1" | "a2" | "b1" | "c1" | "c2" | "d1";
type RecordTab = "plantings" | "inputs" | "tasks" | "yields" | "costs";

interface FieldDetail {
	name: string;
	sub: string;
	status: string;
	statusTone: "ok" | "watch" | "neutral" | "high";
	area: string;
	soil: string;
	slope: string;
	drainage: string;
	elev: string;
	lastSoil: string;
}

interface FieldRecord {
	title: string;
	sub: string;
	meta: string;
	ms: string;
}

const PLOTS: {
	id: PlotId;
	label: string;
	sub: string;
	position: string;
	bg: string;
}[] = [
	{
		id: "a1",
		label: "A1",
		sub: "Maize · 2.8 ha",
		position: "left-[5%] top-[7%] h-[31%] w-[27%]",
		bg: "bg-[rgba(122,150,70,0.42)]",
	},
	{
		id: "a2",
		label: "A2",
		sub: "Maize · 3.2 ha",
		position: "left-[34%] top-[7%] h-[34%] w-[30%]",
		bg: "bg-[rgba(150,170,80,0.46)]",
	},
	{
		id: "b1",
		label: "B1",
		sub: "Beans · 1.6 ha",
		position: "left-[66%] top-[9%] h-[29%] w-[28%]",
		bg: "bg-[rgba(70,110,60,0.5)]",
	},
	{
		id: "c1",
		label: "C1",
		sub: "Beans · 1.4 ha",
		position: "left-[6%] top-[44%] h-[30%] w-[24%]",
		bg: "bg-[rgba(80,120,64,0.5)]",
	},
	{
		id: "c2",
		label: "C2",
		sub: "Kale · 0.8 ha",
		position: "left-[33%] top-[47%] h-[26%] w-[23%]",
		bg: "bg-[rgba(120,168,60,0.5)]",
	},
	{
		id: "d1",
		label: "D1",
		sub: "Fallow · 2.6 ha",
		position: "left-[60%] top-[44%] h-[33%] w-[34%]",
		bg: "bg-[rgba(184,150,96,0.5)]",
	},
];

const FIELD_DETAILS: Record<PlotId, FieldDetail> = {
	a1: {
		name: "Field A1",
		sub: "Maize · planted 14 Mar",
		status: "Healthy",
		statusTone: "ok",
		area: "2.8",
		soil: "Sandy loam",
		slope: "Gentle (3–5%)",
		drainage: "Well-drained",
		elev: "1,847 m",
		lastSoil: "12 Apr 2026",
	},
	a2: {
		name: "Field A2",
		sub: "Maize · planted 18 Mar",
		status: "Needs attention",
		statusTone: "watch",
		area: "3.2",
		soil: "Clay loam",
		slope: "Gentle (2–4%)",
		drainage: "Moderate",
		elev: "1,852 m",
		lastSoil: "12 Apr 2026",
	},
	b1: {
		name: "Field B1",
		sub: "Beans · planted 2 Apr",
		status: "Healthy",
		statusTone: "ok",
		area: "1.6",
		soil: "Loam",
		slope: "Flat (0–2%)",
		drainage: "Well-drained",
		elev: "1,839 m",
		lastSoil: "3 Feb 2026",
	},
	c1: {
		name: "Field C1",
		sub: "Beans · planted 5 Apr",
		status: "Healthy",
		statusTone: "ok",
		area: "1.4",
		soil: "Loam",
		slope: "Flat (0–2%)",
		drainage: "Well-drained",
		elev: "1,833 m",
		lastSoil: "3 Feb 2026",
	},
	c2: {
		name: "Field C2",
		sub: "Kale · planted 20 Apr",
		status: "Soil test overdue",
		statusTone: "high",
		area: "0.8",
		soil: "Silty clay",
		slope: "Moderate (5–8%)",
		drainage: "Poor",
		elev: "1,861 m",
		lastSoil: "18 months ago",
	},
	d1: {
		name: "Field D1",
		sub: "Fallow · resting",
		status: "Fallow",
		statusTone: "neutral",
		area: "2.6",
		soil: "Clay",
		slope: "Moderate (4–7%)",
		drainage: "Moderate",
		elev: "1,858 m",
		lastSoil: "9 Jan 2026",
	},
};

const RECORD_TABS: { key: RecordTab; label: string }[] = [
	{ key: "plantings", label: "Plantings" },
	{ key: "inputs", label: "Inputs" },
	{ key: "tasks", label: "Tasks" },
	{ key: "yields", label: "Yields" },
	{ key: "costs", label: "Costs" },
];

const RECORDS: Record<
	PlotId,
	Record<RecordTab, FieldRecord[]>
> = Object.fromEntries(
	PLOTS.map((p) => [
		p.id,
		{
			plantings: [
				{
					title: `${p.sub.split(" · ")[0]} — current cycle`,
					sub: "Planted this season",
					meta: p.sub.split(" · ")[1] ?? "",
					ms: "Area",
				},
			],
			inputs: [
				{
					title: "DAP fertilizer",
					sub: "Applied at planting",
					meta: "50 kg",
					ms: "Quantity",
				},
			],
			tasks: [
				{
					title: "Top-dress with CAN",
					sub: "Due in 6 days",
					meta: "Pending",
					ms: "Status",
				},
			],
			yields: [
				{
					title: "Previous cycle yield",
					sub: "Last harvest",
					meta: "1.2 t/ha",
					ms: "Yield",
				},
			],
			costs: [
				{
					title: "Input + labor costs",
					sub: "Season to date",
					meta: "KES 8,400",
					ms: "Total",
				},
			],
		},
	]),
) as Record<PlotId, Record<RecordTab, FieldRecord[]>>;

export default function FieldsPage() {
	const [selected, setSelected] = useState<PlotId | null>(null);
	const [tab, setTab] = useState<RecordTab>("plantings");

	const field = selected ? FIELD_DETAILS[selected] : null;
	const records = selected ? RECORDS[selected][tab] : [];

	return (
		<div className="relative h-[calc(100vh-2px)] overflow-hidden">
			<div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#93AC6F] via-[#7B9A56] to-[#C7B489]">
				<div
					className="absolute inset-0 opacity-60"
					style={{
						backgroundImage:
							"repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 22px), repeating-linear-gradient(25deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 26px)",
					}}
				/>

				{PLOTS.map((plot) => (
					<button
						key={plot.id}
						type="button"
						onClick={() => setSelected(plot.id)}
						className={`absolute flex flex-col justify-between rounded-xl border-2 p-2.5 text-white shadow-[0_6px_16px_rgba(0,0,0,0.16)] transition ${plot.position} ${plot.bg} ${
							selected === plot.id
								? "border-[#E9C65A] shadow-[0_0_0_3px_rgba(233,198,90,0.55),0_6px_16px_rgba(0,0,0,0.2)]"
								: "border-white/55"
						}`}
					>
						<span className="text-xs font-bold [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
							{plot.label}
						</span>
						<span className="text-[10.5px] font-medium opacity-90 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
							{plot.sub}
						</span>
					</button>
				))}

				<div className="absolute right-4 top-4 flex items-center gap-3 rounded-xl border border-[#EADFCB] bg-white px-3.5 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
					<div>
						<div className="text-[13.5px] font-bold text-[#20160F]">
							Mkulima Farm
						</div>
						<div className="text-[11.5px] text-[#75583F]">
							6 plots · 12.4 ha
						</div>
					</div>
				</div>

				<button
					type="button"
					className="absolute bottom-4 right-4 flex items-center gap-2 rounded-[11px] border border-[#EADFCB] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#3F2D22] shadow-[0_4px_14px_rgba(0,0,0,0.14)]"
				>
					<Layers size={16} aria-hidden="true" />
					Layers
				</button>

				{!selected && (
					<div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-xl bg-[#140E09]/72 px-4 py-2.5 text-[12.5px] font-semibold text-white backdrop-blur">
						Tap a plot to view its soil & records
					</div>
				)}
			</div>

			{field && (
				<div className="pointer-events-none absolute bottom-5 left-5 top-5 w-[380px]">
					<Card>
						<div className="pointer-events-auto max-h-full overflow-y-auto">
							<div className="flex items-center justify-between">
								<div>
									<div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#957A5C]">
										Field
									</div>
									<div className="font-serif text-[22px] font-semibold tracking-tight text-[#20160F]">
										{field.name}
									</div>
								</div>
								<button
									type="button"
									aria-label="Close field details"
									onClick={() => setSelected(null)}
									className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#EADFCB] bg-white text-[#3F2D22]"
								>
									<X size={18} aria-hidden="true" />
								</button>
							</div>
							<div className="mt-1 flex items-center gap-2.5">
								<span className="text-[13px] text-[#75583F]">{field.sub}</span>
								<Pill tone={field.statusTone}>{field.status}</Pill>
							</div>

							<div className="grid grid-cols-2 gap-x-[18px] gap-y-4 py-4">
								{[
									["Area", `${field.area} ha`],
									["Soil", field.soil],
									["Slope", field.slope],
									["Drainage", field.drainage],
									["Elevation", field.elev],
									["Last soil test", field.lastSoil],
								].map(([label, value]) => (
									<div key={label}>
										<div className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-[#957A5C]">
											{label}
										</div>
										<div className="mt-[3px] text-[14.5px] font-semibold text-[#20160F]">
											{value}
										</div>
									</div>
								))}
							</div>

							<div className="border-t border-[#EADFCB] pt-3.5">
								<div className="mb-1.5 text-[11px] font-bold uppercase tracking-[1.2px] text-[#957A5C]">
									Records derived from this field
								</div>
								<div className="mt-1.5 flex flex-wrap gap-1 rounded-xl bg-[#F4EAD4] p-1">
									{RECORD_TABS.map((t) => (
										<button
											key={t.key}
											type="button"
											onClick={() => setTab(t.key)}
											className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold ${
												tab === t.key
													? "bg-white text-[#20160F] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
													: "text-[#75583F]"
											}`}
										>
											{t.label}
										</button>
									))}
								</div>
								<div className="mt-1">
									{records.map((rec) => (
										<div
											key={rec.title}
											className="flex justify-between gap-3 border-t border-[#EADFCB] py-3.5 first:border-t-0"
										>
											<div className="min-w-0">
												<div className="text-[13.5px] font-semibold text-[#20160F]">
													{rec.title}
												</div>
												<div className="mt-0.5 text-xs text-[#957A5C]">
													{rec.sub}
												</div>
											</div>
											<div className="text-right">
												<div className="text-[13.5px] font-semibold text-[#20160F]">
													{rec.meta}
												</div>
												<div className="mt-0.5 text-[11.5px] text-[#957A5C]">
													{rec.ms}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
