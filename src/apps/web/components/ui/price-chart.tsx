interface PriceChartProps {
	points: number[];
	labels: string[];
	floor: number;
	ceiling: number;
	todayIndex: number;
	peakIndex: number;
	harvestIndex?: number;
}

const WIDTH = 700;
const HEIGHT = 250;
const X0 = 10;
const X1 = 650;
const Y_TOP = 20;
const Y_BOT = 200;

export function PriceChart({
	points,
	labels,
	floor,
	ceiling,
	todayIndex,
	peakIndex,
	harvestIndex,
}: PriceChartProps) {
	const domainMin = Math.min(floor, ...points) * 0.92;
	const domainMax = Math.max(ceiling, ...points) * 1.05;

	const x = (i: number) => X0 + (i / (points.length - 1)) * (X1 - X0);
	const y = (v: number) =>
		Y_BOT - ((v - domainMin) / (domainMax - domainMin)) * (Y_BOT - Y_TOP);

	const linePath = points
		.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
		.join(" ");
	const areaPath = `${linePath} L ${x(points.length - 1)} ${Y_BOT} L ${x(0)} ${Y_BOT} Z`;

	return (
		<svg
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			className="mt-1 block w-full"
			role="img"
			aria-label="Price over the season, with floor and ceiling bounds"
		>
			<line
				x1={X0}
				x2={X1}
				y1={Y_TOP}
				y2={Y_TOP}
				stroke="#EFE7D6"
				strokeWidth={1}
			/>
			<line
				x1={X0}
				x2={X1}
				y1={Y_BOT}
				y2={Y_BOT}
				stroke="#E3D8C2"
				strokeWidth={1}
			/>

			<path d={areaPath} fill="rgba(74,138,84,0.12)" stroke="none" />
			<path
				d={linePath}
				fill="none"
				stroke="#4A8A54"
				strokeWidth={2.5}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>

			<line
				x1={X0}
				x2={X1}
				y1={y(ceiling)}
				y2={y(ceiling)}
				stroke="#B4552A"
				strokeWidth={1}
				strokeDasharray="4 4"
				opacity={0.7}
			/>
			<text
				x={X1}
				y={y(ceiling)}
				dx={-2}
				dy={-5}
				textAnchor="end"
				fontSize={10}
				fontWeight={700}
				fill="#B4552A"
			>
				Ceiling KES {ceiling}
			</text>

			<line
				x1={X0}
				x2={X1}
				y1={y(floor)}
				y2={y(floor)}
				stroke="#7A634A"
				strokeWidth={1}
				strokeDasharray="4 4"
				opacity={0.55}
			/>
			<text
				x={X0}
				y={y(floor)}
				dx={2}
				dy={12}
				fontSize={10}
				fontWeight={700}
				fill="#7A634A"
			>
				Floor KES {floor}
			</text>

			{harvestIndex !== undefined && (
				<>
					<line
						x1={x(harvestIndex)}
						x2={x(harvestIndex)}
						y1={Y_TOP}
						y2={Y_BOT}
						stroke="#C98A2B"
						strokeWidth={1.5}
						strokeDasharray="3 3"
					/>
					<text
						x={x(harvestIndex)}
						y={Y_TOP}
						dy={-4}
						textAnchor="middle"
						fontSize={10}
						fontWeight={700}
						fill="#A06A1E"
					>
						Harvest
					</text>
				</>
			)}

			<line
				x1={x(todayIndex)}
				x2={x(todayIndex)}
				y1={Y_TOP}
				y2={Y_BOT}
				stroke="#2C5A38"
				strokeWidth={1.5}
			/>
			<circle
				cx={x(peakIndex)}
				cy={y(points[peakIndex])}
				r={4}
				fill="#B4552A"
			/>
			<text
				x={x(peakIndex)}
				y={y(points[peakIndex])}
				dx={9}
				dy={-6}
				fontSize={10.5}
				fontWeight={700}
				fill="#B4552A"
			>
				KES {points[peakIndex]}
			</text>
			<circle
				cx={x(todayIndex)}
				cy={y(points[todayIndex])}
				r={5}
				fill="#fff"
				stroke="#2C5A38"
				strokeWidth={2.5}
			/>
			<text
				x={x(todayIndex)}
				y={Y_BOT}
				dy={30}
				textAnchor="middle"
				fontSize={10.5}
				fontWeight={700}
				fill="#2C5A38"
			>
				Today
			</text>

			{labels.map((label, i) => (
				<text
					key={label}
					x={x(i)}
					y={Y_BOT}
					dy={16}
					textAnchor="middle"
					fontSize={10.5}
					fill="#9A8570"
				>
					{label}
				</text>
			))}
		</svg>
	);
}
