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
                className={`filter-text-btn ${topFloorFilter ? 'active' : ''}`}
                onClick={toggleTopFloor}
            >
                Högst upp
            </button>

            {/* New */}
            <button
                className={`filter-text-btn ${iconFilters.new ? 'active' : ''}`}
                onClick={() => toggleIconFilter('new')}
            >
                Nytt
            </button>

            {/* Viewing */}
            <button
                className={`filter-text-btn ${iconFilters.viewing ? 'active' : ''}`}
                onClick={() => toggleIconFilter('viewing')}
            >
                Visning
            </button>

            {/* Bidding */}
            <button
                className={`filter-text-btn ${iconFilters.bidding ? 'active' : ''}`}
                onClick={() => toggleIconFilter('bidding')}
            >
                Budgivning
            </button>

        </div>
    );
};

export default FilterBar;
