const { useState, useEffect, useMemo, useRef } = React

const App = ()=>{
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
			if (inputType === "radio") {
				return {
					...prev,
					[type]: prev[type] === value ? null : value
				}
			}
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

			if (filters.days.length &&
				!trip.days.some(d => filters.days.includes(d)))
				return false

			if (filters.routes.length &&
				!filters.routes.includes(route.number))
				return false

			if (filters.operators.length &&
				!filters.operators.includes(route.operatorId))
				return false

			if (filters.via) {
				const stops = Object.keys(trip.departures)
				if (!stops.includes(filters.via))
					return false
			}

			if (filters.from) {
				const firstStopId = Object.keys(trip.departures)[0]
				const firstStop = data.stops.find(
					stop => stop.id === firstStopId
				)
				if (!firstStop || firstStop.city !== filters.from)
					return false
			}
			return true
		}).sort((a, b) => {
			const getFirstTime = trip => {
				const firstStopId = Object.keys(trip.departures)[0]
				return trip.departures[firstStopId]
			}
			const timeA = getFirstTime(a)
			const timeB = getFirstTime(b)
			return timeA.localeCompare(timeB)
		})
	}, [filters, data])

	return (
		<div className="max-w-xl mx-auto pb-10">
			<Header />
			<FilterBar
				data={data}
				filters={filters}
				toggleFilter={toggleFilter}
				openFilter={openFilter}
				setOpenFilter={setOpenFilter}
			/>
			{data ? (
				<div className="px-4 mt-4 space-y-4">
					{filteredTrips.length === 0 && (
						<div className="bg-white rounded-2xl shadow-sm border p-6 text-center text-sm text-gray-600 flex flex-col gap-2">
							<span>Nothing found</span>
							<span>¯\_(ツ)_/¯</span>
						</div>
					)}
					{filteredTrips.map(trip => {
						const route = data.routes.find(r => r.id === trip.routeId)
						const operator = data.operators.find(o => o.id === route.operatorId)
						const destination = data.destinations.find(d => d.id === trip.destination)
						const firstStop = data.stops.find(s => s.id === Object.keys(trip.departures)[0])

						return (
							<div
								key={trip.id}
								className="bg-white rounded-2xl shadow-sm border p-4"
							>
								<div
									onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
									className="cursor-pointer"
								>
									<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
										<div className="text-lg font-bold"
											style={{color: operator.color}}
										>
											Route {route.number}
										</div>
										<div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
											{trip.days.map(day => (
												<span key={day} 
													className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 capitalize"
												>
													{day.slice(0, 3)}
												</span>
											))}
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
										<div className="flex gap-1">
											<strong>Operator:</strong>
											<a className="hover:underline" href={route.link} target="_blank"
												style={{color: operator.color}}
											>
												{operator.name}
											</a>
										</div>
										{firstStop.from && (
											<div className="flex gap-1">
												<strong>From:</strong>
												{firstStop.link ? (
													<a href={firstStop.link} target="_blank"
														className="hover:underline"
													>
														{firstStop.from}
													</a>
												) : (
													<span>{firstStop.from}</span>
												)}
											</div>
										)}
										{firstStop.city === "cork" && (
											<div className="flex gap-1">
												<strong>Also:</strong>
												<a href="https://maps.app.goo.gl/xhcMxbLtw9wkx8b47" target="_blank"
													className="hover:underline"
												>
													Washington Street
												</a>
											</div>
										)}
										<div className="flex gap-1">
											<strong>Destination:</strong>
											<span>{destination.name}</span>
										</div>
									</div>
								)}
							</div>
						)
					})}
				</div>
			) : <Loader/>}
		</div>
	)
}

const Header = ()=>{
	return (
		<div className="sticky top-0 bg-white z-20 border-b px-4 py-3">
			<h1 className="text-xl font-bold text-center">Bus Departures</h1>
		</div>
	)
}

const Loader = ()=>{
	return (
		<div className="p-6 flex justify-center">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="48">
				<path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1m0 19a8 8 0 1 1 8-8 8 8 0 0 1-8 8" opacity="0.25"/>
				<path d="M10.14 1.16a11 11 0 0 0-9 8.92A1.6 1.6 0 0 0 2.46 12a1.5 1.5 0 0 0 1.65-1.3 8 8 0 0 1 6.66-6.61A1.4 1.4 0 0 0 12 2.69a1.57 1.57 0 0 0-1.86-1.53">
					<animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/>
				</path>
			</svg>
		</div>
	)
}

const FilterBar = ({ data, filters, toggleFilter, openFilter, setOpenFilter }) => {
	const filterRef = useRef(null)

	useEffect(() => {
		if (!openFilter) return
		const handleClickOutside = event => {
			if (filterRef.current && !filterRef.current.contains(event.target)) {
				setOpenFilter(null)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		document.addEventListener("touchstart", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
			document.removeEventListener("touchstart", handleClickOutside)
		}
	}, [openFilter, setOpenFilter])

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
		<div className="relative" ref={filterRef}>
			<div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50 border-b">
				{filterButton("From", "from")}
				{filterButton("Via", "via")}
				{filterButton("Days", "days")}
				{filterButton("Routes", "routes")}
				{filterButton("Operators", "operators")}
			</div>
			{openFilter && (
				<div className="absolute w-full bg-white shadow-lg border-b z-30 p-4 sm:rounded-b-lg">
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

const CheckboxList = ({ type, data, filters, toggleFilter }) => {
	let items = []
	let inputType = "checkbox"

	if (type === "routes")
		items = [...new Set(data?.routes.map(r => r.number))]

	if (type === "operators")
		items = data?.operators.map(o => ({ id: o.id, label: o.name })) || []

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
		items = [
			{ id: "mon", label: "Monday" },
			{ id: "tue", label: "Tuesday" },
			{ id: "wed", label: "Wednesday" },
			{ id: "thu", label: "Thursday" },
			{ id: "fri", label: "Friday" },
			{ id: "sat", label: "Saturday" },
			{ id: "sun", label: "Sunday" }
		]

	return (
		<div className="grid grid-cols-2 gap-3 justify-items-start">
			{items.map(item => {
				const value = typeof item === "string" ? item : item.id
				const label = typeof item === "string" ? item : item.label

				const checked =
					inputType === "checkbox"
						? filters[type].includes(value)
						: filters[type] === value

				return (
					<label key={`${type}-${value}`} className="flex items-center space-x-2 text-sm cursor-pointer">
						<input
							type={inputType}
							name={type}
							checked={checked}
							onClick={() => {
								if (inputType === "radio" && checked) {
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
