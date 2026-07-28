import { Card, CardHead } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const HERDS = [
	{
		count: "18",
		metric: "Milking",
		name: "Dairy cattle",
		sub: "Friesian-Holstein cross",
	},
	{
		count: "6",
		metric: "Healthy",
		name: "Goats",
		sub: "Boer cross, meat & dairy",
	},
	{ count: "240", metric: "Laying", name: "Layer hens", sub: "78% lay rate" },
] as const;

const MILK_BARS = [62, 70, 58, 74, 66, 80, 85] as const;

const HEALTH_ALERTS = [
	{
		title: "CDT vaccination due — 6 goats",
		sub: "Thursday, 10 Jul · booster",
		high: true,
	},
	{ title: "Deworming — full herd", sub: "Scheduled 20 Jul", high: false },
	{
		title: "Baraka — pregnancy check",
		sub: "Vet visit, due Sep calving",
		high: false,
	},
] as const;

const ANIMALS = [
	{
		name: "Baraka",
		tag: "#DC-014",
		breed: "Friesian-Holstein cross",
		status: "Milking",
		tone: "ok" as const,
		note: "22 L/day avg",
	},
	{
		name: "Furaha",
		tag: "#DC-021",
		breed: "Friesian-Holstein cross",
		status: "Dry",
		tone: "neutral" as const,
		note: "Due to calve Sep",
	},
	{
		name: "Nia",
		tag: "#DC-009",
		breed: "Friesian-Holstein cross",
		status: "Milking",
		tone: "ok" as const,
		note: "19 L/day avg",
	},
	{
		name: "Simba",
		tag: "#GT-003",
		breed: "Boer cross",
		status: "Under treatment",
		tone: "watch" as const,
		note: "Hoof care follow-up",
	},
];

export default function LivestockPage() {
	return (
		<div className="p-8">
			<div className="grid grid-cols-3 gap-4">
				{HERDS.map((herd) => (
					<Card key={herd.name}>
						<div className="flex items-center justify-between">
							<div className="font-serif text-[30px] font-semibold leading-none text-[#20160F]">
								{herd.count}
							</div>
							<Pill tone="ok">{herd.metric}</Pill>
						</div>
						<div className="mt-2 font-semibold text-[#20160F]">{herd.name}</div>
						<div className="text-[12.5px] text-[#75583F]">{herd.sub}</div>
					</Card>
				))}
			</div>

			<div className="mt-[18px] grid grid-cols-[1.6fr_1fr] gap-[18px]">
				<div className="flex flex-col gap-4">
					<Card>
						<CardHead
							title="Milk production · last 7 days"
							action={<Pill tone="ok">48 L today</Pill>}
						/>
						<div className="flex h-24 items-end gap-2.5 pt-2">
							{MILK_BARS.map((h) => (
								<div
									key={h}
									className="min-h-1.5 flex-1 rounded-t-md bg-[#346B41]"
									style={{ height: `${h}%` }}
								/>
							))}
						</div>
						<div className="mt-3 flex flex-wrap justify-between gap-4 border-t border-[#EADFCB] pt-3">
							<div>
								<div className="font-serif text-xl font-semibold text-[#20160F]">
									48 L
								</div>
								<div className="text-[11.5px] text-[#957A5C]">Today</div>
							</div>
							<div>
								<div className="font-serif text-xl font-semibold text-[#20160F]">
									46 L
								</div>
								<div className="text-[11.5px] text-[#957A5C]">
									7-day average
								</div>
							</div>
							<div>
								<div className="font-serif text-xl font-semibold text-[#20160F]">
									1,340 L
								</div>
								<div className="text-[11.5px] text-[#957A5C]">This month</div>
							</div>
							<div>
								<div className="font-serif text-xl font-semibold text-[#20160F]">
									KES 67/L
								</div>
								<div className="text-[11.5px] text-[#957A5C]">Coop rate</div>
							</div>
						</div>
					</Card>

					<Card>
						<CardHead
							title="Herd health"
							action={
								<button
									type="button"
									className="text-[12.5px] font-semibold text-[#346B41]"
								>
									Schedule →
								</button>
							}
						/>
						{HEALTH_ALERTS.map((alert) => (
							<div
								key={alert.title}
								className="flex gap-3 border-t border-[#EADFCB] py-3 first:border-t-0"
							>
								<div
									className={`w-[3px] shrink-0 rounded-sm ${alert.high ? "bg-[#B46038]" : "bg-[#B8862B]"}`}
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

				<Card>
					<CardHead
						title="Dairy register"
						action={
							<button
								type="button"
								className="text-[12.5px] font-semibold text-[#346B41]"
							>
								Add animal →
							</button>
						}
					/>
					{ANIMALS.map((animal) => (
						<div
							key={animal.tag}
							className="flex items-center gap-3 border-t border-[#EADFCB] py-3 first:border-t-0"
						>
							<div className="min-w-0">
								<div className="text-[13.5px] font-semibold text-[#20160F]">
									{animal.name}{" "}
									<span className="rounded-md bg-[#F4EAD4] px-1.5 py-0.5 font-mono text-[11px] text-[#75583F]">
										{animal.tag}
									</span>
								</div>
								<div className="text-xs text-[#957A5C]">{animal.breed}</div>
							</div>
							<div className="ml-auto text-right">
								<Pill tone={animal.tone}>{animal.status}</Pill>
								<div className="mt-[3px] text-xs text-[#957A5C]">
									{animal.note}
								</div>
							</div>
						</div>
					))}
				</Card>
			</div>
		</div>
	);
}
