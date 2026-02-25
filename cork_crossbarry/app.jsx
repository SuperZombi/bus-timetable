const { useState, useEffect } = React

function App() {
	const [data, setData] = useState(null)
	const [expandedId, setExpandedId] = useState(null)
	const [openFilter, setOpenFilter] = useState(null)

	const [filters, setFilters] = useState({
		routes: [],
		operators: [],
		stops: [],
		days: []
	})

	useEffect(() => {
		fetch("./data.json")
			.then(r => r.json())
			.then(setData)
	}, [])

	if (!data) return <div className="p-6">Loading...</div>

	const toggleFilter = (type, value) => {
		setFilters(prev => {
			const exists = prev[type].includes(value)
			return {
				...prev,
				[type]: exists
					? prev[type].filter(v => v !== value)
					: [...prev[type], value]
			}
		})
	}

	const filteredTrips = data.trips
		.filter(trip => {
			if (filters.days.length &&
				!trip.days.some(d => filters.days.includes(d))) return false

			const route = data.routes.find(r => r.id === trip.routeId)

			if (filters.routes.length &&
				!filters.routes.includes(route.number)) return false

			if (filters.operators.length &&
				!filters.operators.includes(route.operatorId)) return false

			if (filters.stops.length &&
				!filters.stops.some(stopId =>
					Object.keys(trip.departures).includes(stopId)
				)) return false

			return true
		})

	return (
		<div className="max-w-md mx-auto pb-10">

			<Header />

			<FilterBar
				data={data}
				filters={filters}
				toggleFilter={toggleFilter}
				openFilter={openFilter}
				setOpenFilter={setOpenFilter}
			/>

			<div className="px-4 mt-4 space-y-4">
				{filteredTrips.map(trip => {
					const route = data.routes.find(r => r.id === trip.routeId)
					const operator = data.operators.find(o => o.id === route.operatorId)
					const destination = data.destinations.find(d => d.id === trip.destination)

					return (
						<div
							key={trip.id}
							className="bg-white rounded-2xl shadow-sm border p-4"
						>
							<div
								onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
								className="cursor-pointer"
							>

								<div className="flex justify-between items-center mb-3">
									<div className="text-lg font-bold">
										Route {route.number}
									</div>
									<div className="text-xs text-gray-500">
										{trip.days.join(", ")}
									</div>
								</div>

								<div className="space-y-1">
									{Object.entries(trip.departures).map(([stopId, time]) => {
										const stop = data.stops.find(s => s.id === stopId)
										return (
											<div key={stopId} className="flex justify-between text-sm">
												<span className="text-gray-600">{stop.name}</span>
												<span className="font-semibold">{time}</span>
											</div>
										)
									})}
								</div>
							</div>

							{expandedId === trip.id && (
								<div className="mt-4 pt-3 border-t text-sm text-gray-600 space-y-1">
									<div><strong>Operator:</strong> {operator.name}</div>
									<div><strong>Display on bus:</strong> {destination.name}</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

function Header() {
	return (
		<div className="sticky top-0 bg-white z-20 border-b px-4 py-3">
			<h1 className="text-xl font-bold">Bus Departures</h1>
		</div>
	)
}

function FilterBar({ data, filters, toggleFilter, openFilter, setOpenFilter }) {

	const filterButton = (label, key) => (
		<button
			onClick={() => setOpenFilter(openFilter === key ? null : key)}
			className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border
				${filters[key].length
					? "bg-black text-white"
					: "bg-white text-gray-700"}`}
		>
			{label}
		</button>
	)

	return (
		<div className="relative">

			<div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50 border-b">

				{filterButton("Routes", "routes")}
				{filterButton("Operators", "operators")}
				{filterButton("Stops", "stops")}
				{filterButton("Days", "days")}

			</div>

			{openFilter && (
				<div className="absolute w-full bg-white shadow-lg border-b z-30 p-4">

					<CheckboxList
						type={openFilter}
						data={data}
						filters={filters}
						toggleFilter={toggleFilter}
					/>

				</div>
			)}
		</div>
	)
}

function CheckboxList({ type, data, filters, toggleFilter }) {

	let items = []

	if (type === "routes")
		items = [...new Set(data.routes.map(r => r.number))]

	if (type === "operators")
		items = data.operators.map(o => ({ id: o.id, label: o.name }))

	if (type === "stops")
		items = data.stops.map(s => ({ id: s.id, label: s.name }))

	if (type === "days")
		items = ["mon","tue","wed","thu","fri","sat","sun"]

	return (
		<div className="grid grid-cols-2 gap-3">
			{items.map(item => {
				const value = typeof item === "string" ? item : item.id
				const label = typeof item === "string" ? item : item.label

				return (
					<label key={value} className="flex items-center space-x-2 text-sm">
						<input
							type="checkbox"
							checked={filters[type].includes(value)}
							onChange={() => toggleFilter(type, value)}
						/>
						<span>{label}</span>
					</label>
				)
			})}
		</div>
	)
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
