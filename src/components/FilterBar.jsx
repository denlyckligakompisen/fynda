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
                <span className="material-symbols-outlined">roofing</span>
            </button>

            {/* Nearby */}
            <button
                className={`filter-icon-btn ${cityFilter === 'Uppsala' ? 'disabled' : ''}`}
                onClick={() => cityFilter !== 'Uppsala' && toggleIconFilter('nearby')}
                title={cityFilter === 'Uppsala' ? "Nära jobbet (Data ej tillgänglig)" : "Nära jobbet"}
                style={{
                    opacity: (cityFilter !== 'Uppsala' && iconFilters.nearby) ? 1 : 0.3,
                    cursor: cityFilter === 'Uppsala' ? 'default' : 'pointer',
                    fontSize: '1.5em'
                }}
            >
                <span className="material-symbols-outlined">near_me</span>
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
                <span className="material-symbols-outlined">whatshot</span>
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
                <span className="material-symbols-outlined">calendar_month</span>
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
                <span className="material-symbols-outlined">gavel</span>
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
                {iconFilters.favorites ? (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                ) : (
                    <span className="material-symbols-outlined">favorite_border</span>
                )}
            </button>
        </div>
    );
};

export default FilterBar;
