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
            {/* Top Floor (Up Arrow) */}
            <button
                className="filter-icon-btn"
                onClick={toggleTopFloor}
                title="Högst upp"
                style={{
                    opacity: topFloorFilter ? 1 : 0.3,
                    borderBottom: topFloorFilter ? '2px solid #fff' : '2px solid transparent',
                    fontSize: '1.5em'
                }}
            >
                ⬆️
            </button>

            {/* Nearby */}
            <button
                className="filter-icon-btn"
                onClick={() => cityFilter !== 'Uppsala' && toggleIconFilter('nearby')}
                title={cityFilter === 'Uppsala' ? "Nära jobbet (Data ej tillgänglig)" : "Nära jobbet"}
                style={{
                    opacity: (cityFilter === 'Uppsala' || iconFilters.nearby) ? 1 : 0.3,
                    borderBottom: iconFilters.nearby ? '2px solid #fff' : '2px solid transparent',
                    cursor: cityFilter === 'Uppsala' ? 'default' : 'pointer',
                    fontSize: '1.5em'
                }}
            >
                ⏱️
            </button>

            {/* New */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('new')}
                title="Nytt"
                style={{
                    opacity: iconFilters.new ? 1 : 0.3,
                    borderBottom: iconFilters.new ? '2px solid #fff' : '2px solid transparent',
                    fontSize: '1.5em'
                }}
            >
                ✨
            </button>

            {/* Viewing */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('viewing')}
                title="Planerade visningar"
                style={{
                    opacity: iconFilters.viewing ? 1 : 0.3,
                    borderBottom: iconFilters.viewing ? '2px solid #fff' : '2px solid transparent',
                    fontSize: '1.5em'
                }}
            >
                📅
            </button>

            {/* Bidding */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('bidding')}
                title="Budgivning pågår"
                style={{
                    opacity: iconFilters.bidding ? 1 : 0.3,
                    borderBottom: iconFilters.bidding ? '2px solid #fff' : '2px solid transparent',
                    fontSize: '1.5em'
                }}
            >
                🔨
            </button>
        </div>
    );
};

export default FilterBar;
