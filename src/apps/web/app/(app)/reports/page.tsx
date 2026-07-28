import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress-bar";

const MILK_TREND_BARS = [70, 76, 80, 88, 92, 96] as const;

const COST_PER_CROP = [
	{ crop: "Maize", cost: "KES 23,200" },
	{ crop: "Beans", cost: "KES 11,600" },
	{ crop: "Kale", cost: "KES 4,300" },
] as const;

export default function ReportsPage() {
	return (
		<div className="p-8">
			<div className="mb-4 text-[13px] text-[#75583F]">
				Season and financial summaries · Long rains 2026
			</div>

			<div className="grid grid-cols-3 items-start gap-4">
				<div className="flex flex-col gap-3 rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="flex items-center justify-between">
						<div className="text-base font-semibold text-[#20160F]">
							Season summary
						</div>
						<Pill tone="ok">On track</Pill>
					</div>
					<div className="flex flex-wrap gap-[26px]">
						<div>
							<div className="font-serif text-xl font-semibold text-[#20160F]">
								12.4 ha
							</div>
							<div className="text-[11.5px] text-[#957A5C]">Under crop</div>
						</div>
						<div>
							<div className="font-serif text-xl font-semibold text-[#20160F]">
								~21.4 t
							</div>
							<div className="text-[11.5px] text-[#957A5C]">
								Projected yield
							</div>
						</div>
					</div>
					<button
						type="button"
						className="self-start rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
					>
						Open report
					</button>
				</div>

				<div className="flex flex-col gap-3 rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="text-base font-semibold text-[#20160F]">
						Milk yield trend
					</div>
					<div className="flex h-[70px] items-end gap-2">
						{MILK_TREND_BARS.map((h) => (
							<div
								key={h}
								className="min-h-1.5 flex-1 rounded-t-md bg-[#CDB98F]"
								style={{ height: `${h}%` }}
							/>
						))}
					</div>
					<div className="text-xs text-[#957A5C]">
						Feb → Jul · +14% since dry season feed change
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="text-base font-semibold text-[#20160F]">
						Cost per crop
					</div>
					<div className="flex flex-col gap-2">
						{COST_PER_CROP.map((row) => (
							<div key={row.crop} className="flex items-center justify-between">
								<span className="text-sm text-[#20160F]">{row.crop}</span>
								<span className="text-sm font-semibold text-[#20160F]">
									{row.cost}
								</span>
							</div>
						))}
					</div>
					<button
						type="button"
						className="self-start rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
					>
						Open report
					</button>
				</div>

				<div className="flex flex-col gap-3 rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="text-base font-semibold text-[#20160F]">
						Export data
					</div>
					<div className="text-[13px] text-[#75583F]">
						Download records for records-keeping, loans or cooperative
						reporting.
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
						>
							CSV
						</button>
						<button
							type="button"
							className="rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
						>
							PDF
						</button>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-2xl border border-[#EADFCB] bg-white p-5">
					<div className="flex items-center justify-between">
						<div className="text-base font-semibold text-[#20160F]">
							Profit & loss
						</div>
						<Pill tone="ok">+70% margin</Pill>
					</div>
					<div className="flex flex-wrap gap-[26px]">
						<div>
							<div className="font-serif text-xl font-semibold text-[#346B41]">
								107k
							</div>
							<div className="text-[11.5px] text-[#957A5C]">Income</div>
						</div>
						<div>
							<div className="font-serif text-xl font-semibold text-[#B46038]">
								32k
							</div>
							<div className="text-[11.5px] text-[#957A5C]">Costs</div>
						</div>
						<div>
							<div className="font-serif text-xl font-semibold text-[#20160F]">
								75k
							</div>
							<div className="text-[11.5px] text-[#957A5C]">Net</div>
						</div>
					</div>
					<button
						type="button"
						className="self-start rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
					>
						Open report
					</button>
				</div>

				<div className="flex flex-col gap-3 rounded-2xl border border-[#EADFCB] bg-[#FCF8F0] p-5">
					<div className="text-base font-semibold text-[#20160F]">
						Records health
					</div>
					<div className="text-[13px] text-[#75583F]">
						94% of activities logged this season. Keep it up for accurate
						reports.
					</div>
					<ProgressBar percent={94} />
				</div>
			</div>
		</div>
	);
}
