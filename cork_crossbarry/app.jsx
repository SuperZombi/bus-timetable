const { useState, useEffect, useMemo, useRef, Fragment } = React

const getCurrentDayAndTime = () => {
	const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
	const now = new Date()
	return {
		day: DAY_IDS[now.getDay()],
		time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
	}
}

const filterTripsByFilters = (data, filters) => {
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
}

const App = ()=>{
	const [data, setData] = useState(null)
	const [expandedId, setExpandedId] = useState(null)
	const [openFilter, setOpenFilter] = useState(null)
	const [highlightedTripId, setHighlightedTripId] = useState(null)

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

	const filteredTrips = useMemo(() => filterTripsByFilters(data, filters), [filters, data])

	const goToCurrentBus = () => {
		if (!data) return

		const { day, time } = getCurrentDayAndTime()
		const nowFilters = {
			...filters,
			days: [day]
		}

		setFilters(nowFilters)
		setOpenFilter(null)

		const todayTrips = filterTripsByFilters(data, nowFilters)
		if (!todayTrips.length) {
			setHighlightedTripId(null)
			setExpandedId(null)
			return
		}

		const getFirstTime = trip => {
			const firstStopId = Object.keys(trip.departures)[0]
			return trip.departures[firstStopId]
		}

		const currentOrNextTrip =
			todayTrips.find(trip => getFirstTime(trip) >= time) || todayTrips[0]

		setHighlightedTripId(currentOrNextTrip.id)
		setExpandedId(currentOrNextTrip.id)
	}

	useEffect(() => {
		if (!highlightedTripId) return

		const element = document.getElementById(`trip-${highlightedTripId}`)
		if (!element) return

		element.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [highlightedTripId, filteredTrips])

	return (
		<div className="max-w-xl mx-auto">
			<Header />
			<FilterBar
				data={data}
				filters={filters}
				toggleFilter={toggleFilter}
				openFilter={openFilter}
				setOpenFilter={setOpenFilter}
				onNowClick={goToCurrentBus}
			/>
			{data ? (
				<div className="p-2 space-y-2">
					{filteredTrips.length === 0 && (
						<div className="bg-white rounded-2xl shadow-sm border p-6 text-center text-sm text-gray-600 flex flex-col gap-2">
							<span>Nothing found</span>
							<span>¯\_(ツ)_/¯</span>
						</div>
					)}
					{filteredTrips.map(trip => (
						<TripCard key={trip.id}
							data={data} trip={trip}
							expandedId={expandedId} setExpandedId={setExpandedId}
							isHighlighted={highlightedTripId === trip.id}
							setisHighlighted={setHighlightedTripId}
						/>
					))}
				</div>
			) : <Loader/>}
		</div>
	)
}

const Header = ()=>{
	return (
		<div className="border-b px-4 py-3">
			<h1 className="text-xl font-bold text-center">Bus Schedule</h1>
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

const TripCard = ({data, trip, expandedId, setExpandedId, isHighlighted, setisHighlighted}) => {
	const route = data.routes.find(r => r.id === trip.routeId)
	const operator = data.operators.find(o => o.id === route.operatorId)
	const destination = data.destinations.find(d => d.id === trip.destination)
	const firstStop = data.stops.find(s => s.id === Object.keys(trip.departures)[0])

	return (
		<div
			id={`trip-${trip.id}`}
			className={`bg-white rounded-2xl shadow-sm p-4 border-2 transition-all
			${isHighlighted ? "border-blue-500" : ""}`}
		>
			<div className="cursor-pointer"
				onClick={_=>{
					setExpandedId(expandedId === trip.id ? null : trip.id)
					setisHighlighted(null)
				}}
			>
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
					<div className="text-lg font-bold" style={{color: operator.color}}>
						Route {route.number}
					</div>
					<div className="flex flex-wrap gap-1 mt-2 sm:mt-0 select-none">
						{trip.days.map(day => (
							<span key={day} 
								className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 capitalize"
							>
								{day.slice(0, 3)}
							</span>
						))}
					</div>
				</div>
				<div>
					{Object.entries(trip.departures).map(([stopId, time], stopIndex, allStops) => {
						const stop = data.stops.find(s => s.id === stopId)
						const isFirstStop = stopIndex === 0
						const isLastStop = stopIndex === allStops.length - 1

						return (
							<div key={stopId} className="relative flex items-center gap-4">
								<div className="flex flex-col items-center">
									<span
										className="h-3 w-3 z-10 rounded-full border-2 bg-white border-gray-400"
									/>
									{!isLastStop && (
										<span className="absolute top-0 translate-y-1/2 h-full w-px bg-gray-300"/>
									)}
								</div>
								<div className={`flex items-center gap-4 flex-1 py-2 ${!isFirstStop ? "border-t border-gray-200" : ""}`}>
									<span className="font-mono font-semibold tracking-wide text-gray-800">{time}</span>
									<span className="text-gray-600 ml-auto">{stop.name}</span>
								</div>
							</div>
						)
					})}
				</div>
			</div>
			{expandedId === trip.id && (
				<div className="pt-3 border-t text-sm text-gray-600 space-y-1">
					<div className="flex gap-1">
						<strong>Operator:</strong>
						{operator.img && (
							<img src={operator.img} width="48" className="select-none" draggable={false}/>
						)}
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
							{firstStop.city === "cork" && (
								<Fragment>
									<i>or</i>
									<a href="https://maps.app.goo.gl/xhcMxbLtw9wkx8b47" target="_blank"
										className="hover:underline"
									>
										Washington Street
									</a>
								</Fragment>
							)}
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
}

const FilterBar = ({ data, filters, toggleFilter, openFilter, setOpenFilter, onNowClick }) => {
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
	const FilterBtn = ({label, icon=null, className="", onClick=null}) => {
		return (
			<button onClick={onClick} className={`
				flex gap-2 items-center px-4 py-2 rounded-full text-sm whitespace-nowrap border
				transition hover:bg-black hover:text-white
				${className}`}
			>
				{icon}<span>{label}</span>
			</button>
		)
	}
	const filterButton = (label, key, icon=null) => (
		<FilterBtn label={label} icon={icon}
			onClick={_=>setOpenFilter(openFilter === key ? null : key)}
			className={isActive(filters[key]) ? "bg-black text-white" : "bg-white text-gray-700"}
		/>
	)
	return (
		<div className="sticky top-0 bg-white z-20 select-none" ref={filterRef}>
			<div className="flex gap-2 overflow-x-auto [scrollbar-width:thin] px-4 py-3 bg-gray-50 border-b">
				<FilterBtn
					onClick={onNowClick}
					label={"Now"}
					icon={<i className="fa-solid fa-clock"/>}
				/>
				{filterButton("From", "from", <i className="fa-solid fa-plane-departure"/>)}
				{filterButton("Via", "via", <i className="fa-solid fa-plane"/>)}
				{filterButton("Days", "days", <i className="fa-solid fa-calendar"/>)}
				{filterButton("Routes", "routes", <i className="fa-solid fa-compass"/>)}
				{filterButton("Operators", "operators", <i className="fa-solid fa-bus-simple"/>)}
			</div>
			{openFilter && (
				<div className="absolute w-full flex justify-center bg-white shadow-lg border-b z-20 p-4 sm:rounded-b-lg">
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
		items = data?.routes.filter((route, index, self) =>
			self.findIndex(r => r.number === route.number) === index
		).map(route => {
			const operator = data.operators.find(op => op.id === route.operatorId);
			return {
				id: route.id,
				label: route.number,
				color: operator?.color
			}
		}) || []

	if (type === "operators")
		items = data?.operators.map(o => (
			{ id: o.id, label: o.name, img: o.img, color: o.color }
		)) || []

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
			{ id: "sat", label: "Saturday", color: "red" },
			{ id: "sun", label: "Sunday", color: "red" }
		]

	return (
		<div className="grid grid-cols-2 gap-x-10 gap-y-3 justify-items-start">
			{items.map(item => {
				const value = typeof item === "string" ? item : item.id
				const label = typeof item === "string" ? item : item.label
				const image = typeof item === "string" ? null : item.img
				const color = typeof item === "string" ? null : item.color

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
						{image && <img src={image} width="48" draggable={false}/>}
						<span style={{color: color}}>{label}</span>
					</label>
				)
			})}
		</div>
	)
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
