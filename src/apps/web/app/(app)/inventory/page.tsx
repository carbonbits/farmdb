import { Card, CardHead } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const FILL_TONE = {
	ok: "bg-[#346B41]",
	low: "bg-[#B8862B]",
	reorder: "bg-[#B46038]",
} as const;

const STATUS_TONE = {
	ok: "ok",
	low: "watch",
	reorder: "high",
} as const;

const INVENTORY = [
	{
		name: "DAP fertilizer",
		qty: "12 bags of 50 kg",
		cat: "Fertilizer",
		percent: 70,
		fill: "ok",
		status: "In stock",
	},
	{
		name: "CAN top-dress",
		qty: "3 bags of 50 kg",
		cat: "Fertilizer",
		percent: 25,
		fill: "low",
		status: "Low stock",
	},
	{
		name: "Maize seed (H614)",
		qty: "40 kg",
		cat: "Seed",
		percent: 85,
		fill: "ok",
		status: "In stock",
	},
	{
		name: "Dairy concentrate",
		qty: "2 bags of 70 kg",
		cat: "Feed",
		percent: 12,
		fill: "reorder",
		status: "Reorder",
	},
	{
		name: "Pesticide (cypermethrin)",
		qty: "4 L",
		cat: "Crop protection",
		percent: 55,
		fill: "ok",
		status: "In stock",
	},
	{
		name: "Layer mash",
		qty: "1 bag of 70 kg",
		cat: "Feed",
		percent: 18,
		fill: "reorder",
		status: "Reorder",
	},
] as const;

export default function InventoryPage() {
	return (
		<div className="p-8">
			<Card>
				<CardHead
					title="Farm inputs & supplies"
					action={
						<button
							type="button"
							className="flex items-center gap-2 rounded-[10px] border border-[#EADFCB] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-[#3F2D22]"
						>
							Restock order
						</button>
					}
				/>

				<div className="grid grid-cols-[1.6fr_1fr_1.2fr_90px] gap-3.5 pb-2.5 text-[11px] font-bold uppercase tracking-[0.6px] text-[#957A5C]">
					<span>Item</span>
					<span>Category</span>
					<span>Stock level</span>
					<span>Status</span>
				</div>

				{INVENTORY.map((item) => (
					<div
						key={item.name}
						className="grid grid-cols-[1.6fr_1fr_1.2fr_90px] items-center gap-3.5 border-t border-[#EADFCB] py-3.5"
					>
						<div className="min-w-0">
							<div className="text-[13.5px] font-semibold text-[#20160F]">
								{item.name}
							</div>
							<div className="text-xs text-[#957A5C]">{item.qty}</div>
						</div>
						<div className="text-[13px] text-[#75583F]">{item.cat}</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-[#F4EAD4]">
							<div
								className={`h-full rounded-full ${FILL_TONE[item.fill]}`}
								style={{ width: `${item.percent}%` }}
							/>
						</div>
						<Pill tone={STATUS_TONE[item.fill]}>{item.status}</Pill>
					</div>
				))}
			</Card>
		</div>
	);
}
