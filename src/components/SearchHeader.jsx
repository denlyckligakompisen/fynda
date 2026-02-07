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
    areaFilter,
    expandedCity,
    setExpandedCity,
    stockholmAreas,
    uppsalaAreas,
    handleCityClick,
    handleAreaSelect,
    handleSort,
    sortBy,
    sortDirection,
    isLoading
}) => {
    return (
        <div className="search-header-group">

            {/* Search Box */}
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

            {/* Icon Filters */}
            <FilterBar
                topFloorFilter={topFloorFilter}
                toggleTopFloor={toggleTopFloor}
                iconFilters={iconFilters}
                toggleIconFilter={toggleIconFilter}
                cityFilter={cityFilter}
            />

            {/* Navigation (City/Area selection) */}
            <Navigation
                cityFilter={cityFilter}
                areaFilter={areaFilter}
                expandedCity={expandedCity}
                setExpandedCity={setExpandedCity}
                stockholmAreas={stockholmAreas}
                uppsalaAreas={uppsalaAreas}
                handleCityClick={handleCityClick}
                handleAreaSelect={handleAreaSelect}
                handleSort={handleSort}
                sortBy={sortBy}
                sortDirection={sortDirection}
                isLoading={isLoading}
                topFloorFilter={topFloorFilter}
                iconFilters={iconFilters}
            />
        </div>
    );
};

export default SearchHeader;
