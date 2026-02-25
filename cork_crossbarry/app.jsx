const { useState, useEffect, useMemo } = React

function App() {
	const [data, setData] = useState(null)
	const [expandedId, setExpandedId] = useState(null)
	const [openFilter, setOpenFilter] = useState(null)

	const [filters, setFilters] = useState({
		routes: [],
		operators: [],
		days: [],
		via: null,
		from: null
	})

	useEffect(() => {
		fetch("./data.json")
			.then(r => r.json())
			.then(setData)
	}, [])

	

	const toggleFilter = (type, value, inputType = "checkbox") => {
	setFilters(prev => {

			// RADIO логика
			if (inputType === "radio") {
				return {
					...prev,
					[type]: prev[type] === value ? null : value
				}
			}

			// CHECKBOX логика
			const exists = prev[type].includes(value)

			return {
				...prev,
				[type]: exists
					? prev[type].filter(v => v !== value)
					: [...prev[type], value]
			}
		})
	}

	const filteredTrips = useMemo(() => {

		if (!data) return []

		return data.trips.filter(trip => {

			const route = data.routes.find(r => r.id === trip.routeId)

			// DAYS (массив)
			if (filters.days.length &&
				!trip.days.some(d => filters.days.includes(d)))
				return false

			// ROUTES (массив)
			if (filters.routes.length &&
				!filters.routes.includes(route.number))
				return false

			// OPERATORS (массив)
			if (filters.operators.length &&
				!filters.operators.includes(route.operatorId))
				return false

			// VIA (radio → строка или null)
			if (filters.via) {
				const stops = Object.keys(trip.departures)
				if (!stops.includes(filters.via))
					return false
			}

			// FROM (radio → строка или null)
			if (filters.from) {
				const firstStopId = Object.keys(trip.departures)[0]

				const firstStop = data.stops.find(
					stop => stop.id === firstStopId
				)

				if (!firstStop || firstStop.city !== filters.from)
					return false
			}

			return true
		})

	}, [filters, data])

	if (!data) return <div className="p-6">Loading...</div>

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
												<span className="text-gray-600 flex gap-1 items-center">
													<span>{stop.name}</span>
													{stop.from && <span className="text-gray-400 text-xs">
														({stop.from})
													</span>}
												</span>
												<span className="font-semibold">{time}</span>
											</div>
										)
									})}
								</div>
							</div>

							{expandedId === trip.id && (
								<div className="mt-4 pt-3 border-t text-sm text-gray-600 space-y-1">
									<div className="flex gap-1">
										<strong>Operator:</strong>
										<a className="hover:underline" href={route.link} target="_blank"
											style={{color: operator.color}}
										>
											{operator.name}
										</a>
									</div>
									<div><strong>Destination:</strong> {destination.name}</div>
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

	const isActive = value => {
		if (Array.isArray(value)) return value.length > 0
		return Boolean(value)
	}

	const filterButton = (label, key) => (
		<button
			onClick={() => setOpenFilter(openFilter === key ? null : key)}
			className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border
				${isActive(filters[key])
					? "bg-black text-white"
					: "bg-white text-gray-700"}`}
		>
			{label}
		</button>
	)

	return (
		<div className="relative">

			<div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50 border-b">

				{filterButton("From", "from")}
				{filterButton("Via", "via")}
				{filterButton("Routes", "routes")}
				{filterButton("Operators", "operators")}
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
	let inputType = "checkbox"

	if (type === "routes")
		items = [...new Set(data.routes.map(r => r.number))]

	if (type === "operators")
		items = data.operators.map(o => ({ id: o.id, label: o.name }))

	if (type === "via") {
		items = [
			{id: "crossbarry", label: "Crossbarry"},
			{id: "innishannon", label: "Innishannon"},
		]
		inputType = "radio"
	}

	if (type === "from") {
		items = [
			{id: "cork", label: "Cork"},
			{id: "bandon", label: "Bandon"},
		]
		inputType = "radio"
	}

	if (type === "days")
		items = ["mon","tue","wed","thu","fri","sat","sun"]

	return (
		<div className="grid grid-cols-2 gap-3">
			{items.map(item => {
				const value = typeof item === "string" ? item : item.id
				const label = typeof item === "string" ? item : item.label

				const checked =
					inputType === "checkbox"
						? filters[type].includes(value)
						: filters[type] === value

				return (
					<label key={`${type}-${value}`} className="flex items-center space-x-2 text-sm">
						<input
							type={inputType}
							name={type}
							checked={checked}
							onClick={() => {
								if (inputType === "radio" && checked) {
									// если уже выбран → снять
									toggleFilter(type, null, inputType)
								} else {
									toggleFilter(type, value, inputType)
								}
							}}
							readOnly
						/>
						<span>{label}</span>
					</label>
				)
			})}
		</div>
	)
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
