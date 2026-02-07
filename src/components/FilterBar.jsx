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
                <span className="material-symbols-outlined">work_outline</span>
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
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M7.25 12.5L4.75 9H3.5v6h1.25v-3.5L7.3 15h1.2V9H7.25zM9.5 15h4v-1.25H11v-1.11h2.5v-1.26H11v-1.12h2.5V9h-4zm9.75-6v4.5h-1.12V9.99h-1.25v3.52h-1.13V9H14.5v5c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V9h-1.25z" /></svg>
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
                <span className="material-symbols-outlined">favorite_border</span>
            </button>
        </div>
    );
};

export default FilterBar;
