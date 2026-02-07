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
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M120-80v-80h140v-180h180v-180h180v-180h180v-140h80v220H700v180H520v180H340v180H120Z" /></svg>
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
