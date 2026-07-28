import { Card, CardHead } from "@/components/ui/card";

const KPIS = [
	{
		label: "Income · July",
		value: "107,000",
		valueCls: "text-[#346B41]",
		sub: "KES · 4 revenue streams",
		subCls: "text-[#957A5C]",
	},
	{
		label: "Expenses · July",
		value: "32,100",
		valueCls: "text-[#B46038]",
		sub: "KES · feed, inputs, labour",
		subCls: "text-[#957A5C]",
	},
	{
		label: "Net · July",
		value: "+ 74,900",
		valueCls: "text-[#20160F]",
		sub: "KES · margin 70%",
		subCls: "text-[#346B41]",
	},
	{
		label: "Coop balance",
		value: "41,200",
		valueCls: "text-[#20160F]",
		sub: "KES · payout on 15 Jul",
		subCls: "text-[#957A5C]",
	},
] as const;

const TRANSACTIONS = [
	{
		date: "8 Jul",
		desc: "Milk delivery — Nakuru Dairy Co-op",
		cat: "Income · Livestock",
		amt: "+ KES 3,216",
		dir: "in",
	},
	{
		date: "6 Jul",
		desc: "DAP fertilizer restock",
		cat: "Expense · Inputs",
		amt: "− KES 9,100",
		dir: "out",
	},
	{
		date: "4 Jul",
		desc: "Casual labour — top-dressing",
		cat: "Expense · Labour",
		amt: "− KES 4,500",
		dir: "out",
	},
	{
		date: "2 Jul",
		desc: "Kale sales — market day",
		cat: "Income · Crops",
		amt: "+ KES 8,400",
		dir: "in",
	},
	{
		date: "29 Jun",
		desc: "Layer feed restock",
		cat: "Expense · Feed",
		amt: "− KES 6,200",
		dir: "out",
	},
	{
		date: "27 Jun",
		desc: "Egg sales",
		cat: "Income · Livestock",
		amt: "+ KES 5,150",
		dir: "in",
	},
	{
		date: "24 Jun",
		desc: "Vet callout — Baraka",
		cat: "Expense · Livestock",
		amt: "− KES 3,500",
		dir: "out",
	},
] as const;

const COST_BREAKDOWN = [
	{ label: "Feed", amount: "KES 10,500", percent: 33, color: "#7A5A34" },
	{ label: "Labour", amount: "KES 9,000", percent: 28, color: "#B46038" },
	{ label: "Inputs", amount: "KES 9,100", percent: 28, color: "#346B41" },
	{ label: "Livestock", amount: "KES 3,500", percent: 11, color: "#4A6D7A" },
] as const;

export default function FinancesPage() {
	return (
		<div className="p-8">
			<div className="grid grid-cols-4 gap-4">
				{KPIS.map((kpi) => (
					<Card key={kpi.label}>
						<div className="text-[12.5px] font-medium text-[#75583F]">
							{kpi.label}
						</div>
						<div
							className={`font-serif text-[27px] font-semibold leading-none ${kpi.valueCls}`}
						>
							{kpi.value}
						</div>
						<div className={`mt-0.5 text-xs ${kpi.subCls}`}>{kpi.sub}</div>
					</Card>
				))}
			</div>

			<div className="mt-[18px] grid grid-cols-[1.6fr_1fr] gap-[18px]">
				<Card>
					<CardHead
						title="Recent transactions"
						action={
							<button
								type="button"
								className="text-[12.5px] font-semibold text-[#346B41]"
							>
								Add entry →
							</button>
						}
					/>
					{TRANSACTIONS.map((txn) => (
						<div
							key={`${txn.date}-${txn.desc}`}
							className="flex items-center gap-3.5 border-t border-[#EADFCB] py-3 first:border-t-0"
						>
							<span className="w-[52px] shrink-0 font-mono text-[11.5px] text-[#957A5C]">
								{txn.date}
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-[13.5px] font-semibold text-[#20160F]">
									{txn.desc}
								</div>
								<div className="text-xs text-[#957A5C]">{txn.cat}</div>
							</div>
							<span
								className={`ml-auto whitespace-nowrap text-[13.5px] font-bold ${
									txn.dir === "in" ? "text-[#346B41]" : "text-[#B46038]"
								}`}
							>
								{txn.amt}
							</span>
						</div>
					))}
				</Card>

				<div className="flex flex-col gap-4">
					<Card>
						<div className="mb-3 text-base font-semibold text-[#20160F]">
							Where costs go · July
						</div>
						<div className="my-2 flex h-2.5 overflow-hidden rounded-md">
							{COST_BREAKDOWN.map((c) => (
								<div
									key={c.label}
									style={{ width: `${c.percent}%`, background: c.color }}
								/>
							))}
						</div>
						<div className="mt-3 flex flex-col gap-2">
							{COST_BREAKDOWN.map((c) => (
								<div
									key={c.label}
									className="flex items-center justify-between"
								>
									<span className="flex items-center gap-2 text-sm text-[#20160F]">
										<span
											className="h-2 w-2 rounded-full"
											style={{ background: c.color }}
										/>
										{c.label}
									</span>
									<span className="text-sm font-semibold text-[#20160F]">
										{c.amount}
									</span>
								</div>
							))}
						</div>
					</Card>

					<Card warm>
						<div className="mb-1.5 text-base font-semibold text-[#20160F]">
							Milk cooperative
						</div>
						<div className="text-[13px] text-[#75583F]">
							1,340 L delivered this month at KES 67/L. Next payout 15 July.
						</div>
						<button
							type="button"
							className="mt-3 rounded-[10px] bg-[#346B41] px-3 py-[7px] text-[12.5px] font-semibold text-[#F4EAD4]"
						>
							View production
						</button>
					</Card>
				</div>
			</div>
		</div>
	);
}
