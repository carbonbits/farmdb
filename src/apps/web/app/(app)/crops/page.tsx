import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress-bar";

const BAND_GRADIENT = {
	gold: "bg-gradient-to-r from-[#C98A2B] to-[#7A5A34]",
	green: "bg-gradient-to-r from-[#4A8A54] to-[#2C5A38]",
	lime: "bg-gradient-to-r from-[#8FBF59] to-[#5F9A3A]",
	tan: "bg-gradient-to-r from-[#C7B489] to-[#A9906A]",
} as const;

const CROPS = [
	{
		name: "Maize",
		variety: "H614",
		area: "6.0 ha",
		band: "gold",
		stage: "Vegetative",
		percent: 45,
		fields: "Fields A1, A2",
		season: "Long rains 2026",
		expected: "Expected harvest: Sep 2026",
		next: "Next: top-dress with CAN",
	},
	{
		name: "Beans",
		variety: "Rosecoco",
		area: "3.0 ha",
		band: "green",
		stage: "Flowering",
		percent: 65,
		fields: "Fields B1, C1",
		season: "Long rains 2026",
		expected: "Expected harvest: Aug 2026",
		next: "Next: pest scouting",
	},
	{
		name: "Kale",
		variety: "Collards",
		area: "0.8 ha",
		band: "lime",
		stage: "Mature",
		percent: 90,
		fields: "Field C2",
		season: "Continuous",
		expected: "Expected harvest: ongoing",
		next: "Next: weekly harvest",
	},
	{
		name: "Fallow rotation",
		variety: "Rested",
		area: "2.6 ha",
		band: "tan",
		stage: "Resting",
		percent: 20,
		fields: "Field D1",
		season: "Long rains 2026",
		expected: "Expected planting: Oct 2026",
		next: "Next: soil test",
	},
] as const;

export default function CropsPage() {
	return (
		<div className="p-8">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<span className="text-[13px] text-[#75583F]">
					4 crops across 12.4 ha · Long rains 2026 season
				</span>
				<button
					type="button"
					className="flex items-center gap-2 rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
				>
					New planting
				</button>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{CROPS.map((crop) => (
					<div
						key={crop.name}
						className="overflow-hidden rounded-2xl border border-[#EADFCB] bg-white"
					>
						<div className={`h-1.5 ${BAND_GRADIENT[crop.band]}`} />
						<div className="p-5">
							<div className="flex items-center justify-between gap-3">
								<div>
									<div className="text-lg font-semibold text-[#20160F]">
										{crop.name}
									</div>
									<div className="text-[12.5px] text-[#75583F]">
										{crop.variety} · {crop.area}
									</div>
								</div>
								<Pill tone="ok">{crop.stage}</Pill>
							</div>

							<ProgressBar percent={crop.percent} />

							<div className="flex items-center justify-between">
								<span className="text-xs text-[#75583F]">{crop.fields}</span>
								<span className="text-xs font-semibold text-[#20160F]">
									{crop.season}
								</span>
							</div>

							<div className="mt-3.5 flex items-center justify-between border-t border-[#EADFCB] pt-3.5">
								<div className="min-w-0">
									<div className="text-sm font-bold text-[#20160F]">
										{crop.expected}
									</div>
									<div className="text-xs text-[#75583F]">{crop.next}</div>
								</div>
								<button
									type="button"
									className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
								>
									Map
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
