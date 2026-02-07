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
        <div className="mobile-filters-row">
            {/* Top Floor */}
            <button
                className={`filter-icon-btn ${topFloorFilter ? 'active' : ''}`}
                onClick={toggleTopFloor}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-240h177v-133h103v-133h103v-134h97v-80H543v133H440v133H337v134h-97v80Zm-40 120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" /></svg>
            </button>

            {/* Nearby */}
            <button
                className={`filter-icon-btn ${cityFilter === 'Uppsala' ? 'disabled' : ''} ${iconFilters.nearby ? 'active' : ''}`}
                onClick={() => cityFilter !== 'Uppsala' && toggleIconFilter('nearby')}
            >
                <span className="material-symbols-outlined">work_outline</span>
            </button>

            {/* New */}
            <button
                className={`filter-icon-btn ${iconFilters.new ? 'active' : ''}`}
                onClick={() => toggleIconFilter('new')}
            >
                <span className="material-symbols-outlined">whatshot</span>
            </button>

            {/* Viewing */}
            <button
                className={`filter-icon-btn ${iconFilters.viewing ? 'active' : ''}`}
                onClick={() => toggleIconFilter('viewing')}
            >
                <span className="material-symbols-outlined">calendar_month</span>
            </button>

            {/* Bidding */}
            <button
                className={`filter-icon-btn ${iconFilters.bidding ? 'active' : ''}`}
                onClick={() => toggleIconFilter('bidding')}
            >
                <span className="material-symbols-outlined">gavel</span>
            </button>

        </div>
    );
};

export default FilterBar;
