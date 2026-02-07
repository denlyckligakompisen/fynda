import FilterBar from './FilterBar';
import Navigation from './Navigation';

/**
 * Reusable header component for search, filtering and navigation
 */
const SearchHeader = ({
    searchQuery,
    setSearchQuery,
    topFloorFilter,
    toggleTopFloor,
    iconFilters,
    toggleIconFilter,
    cityFilter,
    handleCityClick,
    handleSort,
    sortBy,
    sortDirection,
    isLoading
}) => {
    return (
        <div className="search-header-group">

            {/* Navigation (City/Area selection) - FIRST */}
            <Navigation
                cityFilter={cityFilter}
                handleCityClick={handleCityClick}
            />

            {/* Search Box - SECOND */}
            <div className="search-container">
                <div className="search-input-wrapper">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Sök adress eller område..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Icon Filters - THIRD */}
            <FilterBar
                topFloorFilter={topFloorFilter}
                toggleTopFloor={toggleTopFloor}
                iconFilters={iconFilters}
                toggleIconFilter={toggleIconFilter}
                cityFilter={cityFilter}
            />
        </div>
    );
};

export default SearchHeader;
