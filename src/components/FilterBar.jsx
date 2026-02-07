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
                <span className="material-symbols-outlined">roofing</span>
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

            {/* Favorites Only (in search tab) */}
            <button
                className={`filter-icon-btn ${iconFilters.favorites ? 'active' : ''}`}
                onClick={() => toggleIconFilter('favorites')}
            >
                <span className="material-symbols-outlined">favorite_border</span>
            </button>
        </div>
    );
};

export default FilterBar;
