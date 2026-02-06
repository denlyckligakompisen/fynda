/**
 * Filter icon bar component
 */
const FilterBar = ({
    topFloorFilter,
    toggleTopFloor,
    iconFilters,
    toggleIconFilter,
    cityFilter
}) => {
    return (
        <div className="nav-row-filters">
            {/* Top Floor (Elevator) */}
            <button
                className="filter-icon-btn"
                onClick={toggleTopFloor}
                title="Högst upp"
                style={{
                    opacity: topFloorFilter ? 1 : 0.3,
                    borderBottom: topFloorFilter ? '2px solid #fff' : '2px solid transparent'
                }}
            >
                <img
                    src="/elevator.png"
                    alt="Top floor"
                    style={{ filter: 'invert(1)' }}
                />
            </button>

            {/* Nearby (Walking < 15m) - Different behavior for Uppsala */}
            <button
                className="filter-icon-btn"
                onClick={() => cityFilter !== 'Uppsala' && toggleIconFilter('nearby')}
                title={cityFilter === 'Uppsala' ? "Nära (Data ej tillgänglig)" : "Nära"}
                style={{
                    opacity: (cityFilter === 'Uppsala' || iconFilters.nearby) ? 1 : 0.3,
                    borderBottom: iconFilters.nearby ? '2px solid #fff' : '2px solid transparent',
                    cursor: cityFilter === 'Uppsala' ? 'default' : 'pointer'
                }}
            >
                <img
                    src="/stopwatch.png"
                    alt="Nära"
                    style={{ width: '1.5em', height: '1.5em', filter: 'invert(1)' }}
                />
            </button>

            {/* New */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('new')}
                title="Nytt"
                style={{
                    opacity: iconFilters.new ? 1 : 0.3,
                    borderBottom: iconFilters.new ? '2px solid #fff' : '2px solid transparent'
                }}
            >
                <img src="/new.png" alt="Nytt" style={{ filter: 'invert(1)' }} />
            </button>

            {/* Viewing */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('viewing')}
                title="Planerade visningar"
                style={{
                    opacity: iconFilters.viewing ? 1 : 0.3,
                    borderBottom: iconFilters.viewing ? '2px solid #fff' : '2px solid transparent'
                }}
            >
                <img src="/calendar.png" alt="Visning" style={{ filter: 'invert(1)' }} />
            </button>

            {/* Bidding */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('bidding')}
                title="Budgivning pågår"
                style={{
                    opacity: iconFilters.bidding ? 1 : 0.3,
                    borderBottom: iconFilters.bidding ? '2px solid #fff' : '2px solid transparent'
                }}
            >
                <img src="/bidding.png" alt="Budgivning pågår" />
            </button>
        </div>
    );
};

export default FilterBar;
