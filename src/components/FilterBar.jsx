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
                    fontSize: '1.5em'
                }}
            >
                🔨
            </button>

            {/* Favorites Only */}
            <button
                className="filter-icon-btn"
                onClick={() => toggleIconFilter('favorites')}
                title="Visa endast favoriter"
                style={{
                    opacity: iconFilters.favorites ? 1 : 0.3,
                    fontSize: '1.5em',
                    marginLeft: '4px'
                }}
            >
                ❤️
            </button>
        </div>
    );
};

export default FilterBar;
