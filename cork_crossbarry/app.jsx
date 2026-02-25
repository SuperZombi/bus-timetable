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

const FilterAccordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
	<div className="border-b border-gray-100">
	  <button 
		onClick={() => setIsOpen(!isOpen)}
		className="w-full py-3 flex justify-between items-center font-medium text-gray-700"
	  >
		<span>{title}</span>
		<span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
	  </button>
	  {isOpen && <div className="pb-4 animate-fadeIn">{children}</div>}
	</div>
  );
};
const TripCard = ({ trip }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
	<div 
	  onClick={() => setIsExpanded(!isExpanded)}
	  className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
	>
	  <div className="flex justify-between items-center">
		<div className="flex items-center gap-3">
		  <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">
			{trip.routeNumber}
		  </div>
		  <div>
			<div className="text-lg font-bold text-gray-900">{trip.departures[0].time}</div>
			<div className="text-xs text-gray-500 uppercase tracking-wider">
			  via {trip.via}
			</div>
		  </div>
		</div>
		<div className="text-right">
		  <div className="text-sm font-medium text-gray-700">{trip.destinationName}</div>
		  <div className="text-[10px] text-gray-400">Tap for details</div>
		</div>
	  </div>

	  {isExpanded && (
		<div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-3">
		  <div className="flex justify-between text-sm">
			<span className="text-gray-500">Перевозчик:</span>
			<span className="font-semibold">{trip.operatorName}</span>
		  </div>
		  <div className="bg-gray-50 rounded-xl p-3">
			<p className="text-xs font-bold text-gray-400 mb-2">ОСТАНОВКИ</p>
			{trip.departures.map((dep, idx) => (
			  <div key={idx} className="flex justify-between py-1 text-sm">
				<span className={idx === 0 ? "font-bold" : ""}>{dep.stopName}</span>
				<span className="font-mono">{dep.time}</span>
			  </div>
			))}
		  </div>
		</div>
	  )}
	</div>
  );
};

function FilterSection({ data, filters, toggleFilter }) {
	const [activeFilter, setActiveFilter] = useState(null)
	
	return (
		<div>
		<div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
            <FilterButton 
                label="Route" 
                active={filters.routes.length > 0} 
                onClick={() => setActiveFilter(activeFilter === 'routes' ? null : 'routes')} 
            />
            <FilterButton 
                label="Operator" 
                active={filters.operators.length > 0} 
                onClick={() => setActiveFilter(activeFilter === 'operators' ? null : 'operators')} 
            />

            <FilterButton 
                label="Day" 
                active={filters.days.length > 0} 
                onClick={() => setActiveFilter(activeFilter === 'days' ? null : 'days')} 
            />
        </div>
        {activeFilter && (
                <div className="absolute left-0 right-0 bg-white border-b shadow-xl p-4 mt-2 animate-slideDown z-30">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm uppercase text-gray-400">{activeFilter}</span>
                        <button onClick={() => setActiveFilter(null)} className="text-blue-600 text-sm font-bold">Done</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {activeFilter === 'routes' && [...new Set(data.routes.map(r => r.number))].map(num => (
                            <Checkbox key={num} label={`Route ${num}`} checked={filters.routes.includes(num)} onChange={() => toggleFilter('routes', num)} />
                        ))}
                        {activeFilter === 'operators' && data.operators.map(op => (
                            <Checkbox key={op.id} label={op.name} checked={filters.operators.includes(op.id)} onChange={() => toggleFilter('operators', op.id)} />
                        ))}
                        {activeFilter === 'origin' && data.stops.filter(s => ["cork_parnell", "cork_wcc", "bandon"].includes(s.id)).map(stop => (
                            <Checkbox key={stop.id} label={stop.name} checked={filters.origin.includes(stop.id)} onChange={() => toggleFilter('origin', stop.id)} />
                        ))}
                        {activeFilter === 'days' && ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(day => (
                            <Checkbox key={day} label={day.toUpperCase()} checked={filters.days.includes(day)} onChange={() => toggleFilter('days', day)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
	)
	return (
		<div className="bg-white rounded-xl shadow p-4 space-y-4">

			<FilterAccordion title="Маршруты">
				<CheckboxGroup
					title="Routes"
					items={[...new Set(data.routes.map(r => r.number))]}
					selected={filters.routes}
					onToggle={v => toggleFilter("routes", v)}
				/>
			</FilterAccordion>
			
			<FilterAccordion title="Перевозчик">
				<CheckboxGroup
					title="Operators"
					items={data.operators.map(o => ({ id: o.id, label: o.name }))}
					selected={filters.operators}
					onToggle={v => toggleFilter("operators", v)}
				/>
			</FilterAccordion>

			<FilterAccordion title="Остановка отправления">
				<CheckboxGroup
					title="Stops"
					items={data.stops.map(s => ({ id: s.id, label: s.name }))}
					selected={filters.stops}
					onToggle={v => toggleFilter("stops", v)}
				/>
			</FilterAccordion>

			<FilterAccordion title="День недели">
				<CheckboxGroup
					title="Day"
					items={["mon","tue","wed","thu","fri","sat","sun"]}
					selected={filters.days}
					onToggle={v => toggleFilter("days", v)}
				/>
			</FilterAccordion>

		</div>
	)
}

function FilterButton({ label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors
                ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
        >
            {label} {active && '●'}
        </button>
    )
}
function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="rounded text-blue-600" />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
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
