const { useState, useEffect } = React

function App() {
	const [data, setData] = useState(null)
	const [expandedId, setExpandedId] = useState(null)

	const [filters, setFilters] = useState({
		routes: [],
		operators: [],
		stops: [],
		days: [],
		destinations: []
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
			if (filters.days.length && !trip.days.some(d => filters.days.includes(d))) return false
			if (filters.destinations.length && !filters.destinations.includes(trip.destination)) return false

			const route = data.routes.find(r => r.id === trip.routeId)

			if (filters.routes.length && !filters.routes.includes(route.number)) return false
			if (filters.operators.length && !filters.operators.includes(route.operatorId)) return false
			if (filters.stops.length && !filters.stops.some(s => Object.keys(trip.departures).includes(s))) return false

			return true
		})
		.sort((a, b) => {
			const timeA = Object.values(a.departures)[0]
			const timeB = Object.values(b.departures)[0]
			return timeA.localeCompare(timeB)
		})

	return (
		<div className="max-w-md mx-auto p-4">

			<h1 className="text-2xl text-center font-bold mb-4">Cork Bus Schedule</h1>

			<FilterSection
				data={data}
				filters={filters}
				toggleFilter={toggleFilter}
			/>

			<div className="space-y-3 mt-4">
				{filteredTrips.map(trip => {
					const route = data.routes.find(r => r.id === trip.routeId)
					const operator = data.operators.find(o => o.id === route.operatorId)
					const destination = data.destinations.find(d => d.id === trip.destination)

					const firstStopId = Object.keys(trip.departures)[0]
					const firstTime = trip.departures[firstStopId]
					const firstStop = data.stops.find(s => s.id === firstStopId)

					return (
						<div
							key={trip.id}
							className="bg-white rounded-xl shadow p-4 cursor-pointer"
							onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
						>
							<div className="flex justify-between items-center">
								<div>
									<div className="text-2xl font-bold">{firstTime}</div>
									<div className="text-sm text-gray-500">
										Route {route.number} → {destination.name}
									</div>
								</div>
								<div className="text-gray-400">
									{expandedId === trip.id ? "▲" : "▼"}
								</div>
							</div>

							{expandedId === trip.id && (
								<div className="mt-4 text-sm border-t pt-3 space-y-1">
									<div><strong>Operator:</strong> {operator.name}</div>
									<div><strong>From:</strong> {firstStop.name}</div>
									<div><strong>Destination (display):</strong> {destination.name}</div>

									<div className="mt-2">
										<strong>Stops:</strong>
										{Object.entries(trip.departures).map(([stopId, time]) => {
											const stop = data.stops.find(s => s.id === stopId)
											return (
												<div key={stopId} className="flex justify-between">
													<span>{stop.name}</span>
													<span>{time}</span>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

function FilterSection({ data, filters, toggleFilter }) {
	return (
		<div className="bg-white rounded-xl shadow p-4 space-y-4">

			<CheckboxGroup
				title="Routes"
				items={[...new Set(data.routes.map(r => r.number))]}
				selected={filters.routes}
				onToggle={v => toggleFilter("routes", v)}
			/>

			<CheckboxGroup
				title="Operators"
				items={data.operators.map(o => ({ id: o.id, label: o.name }))}
				selected={filters.operators}
				onToggle={v => toggleFilter("operators", v)}
			/>

			<CheckboxGroup
				title="Stops"
				items={data.stops.map(s => ({ id: s.id, label: s.name }))}
				selected={filters.stops}
				onToggle={v => toggleFilter("stops", v)}
			/>

			<CheckboxGroup
				title="Day"
				items={["mon","tue","wed","thu","fri","sat","sun"]}
				selected={filters.days}
				onToggle={v => toggleFilter("days", v)}
			/>

			<CheckboxGroup
				title="Destination"
				items={data.destinations.map(d => ({ id: d.id, label: d.name }))}
				selected={filters.destinations}
				onToggle={v => toggleFilter("destinations", v)}
			/>

		</div>
	)
}

function CheckboxGroup({ title, items, selected, onToggle }) {
	return (
		<div>
			<h2 className="font-semibold mb-2">{title}</h2>
			<div className="grid grid-cols-2 gap-2">
				{items.map(item => {
					const value = typeof item === "string" ? item : item.id
					const label = typeof item === "string" ? item : item.label

					return (
						<label key={value} className="flex items-center space-x-2 text-sm">
							<input
								type="checkbox"
								checked={selected.includes(value)}
								onChange={() => onToggle(value)}
							/>
							<span>{label}</span>
						</label>
					)
				})}
			</div>
		</div>
	)
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
