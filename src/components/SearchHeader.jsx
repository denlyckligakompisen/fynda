import { Autocomplete, TextField, InputAdornment } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useState, useEffect, useRef } from 'react';
import FilterBar from './FilterBar';
import Navigation from './Navigation';

/**
 * Reusable header component for search, filtering and navigation
 */
import SortingControl from './SortingControl';

/**
 * Reusable header component for search, filtering and navigation
 */
const SearchHeader = ({
    searchQuery,
    setSearchQuery,
    topFloorFilter,
    toggleTopFloor,
    favoritesOnly,
    toggleFavoritesOnly,
    iconFilters,
    toggleIconFilter,
    viewingDateFilter,
    viewingDates,
    setViewingDateFilter,
    cityFilter,
    handleCityClick,
    handleSort,
    sortBy,
    sortDirection,
    sortAscending,
    isLoading,
    searchSuggestions = [],
    filteredCount,
    totalCount,
    clearFilters
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="search-header-group">


            {/* Navigation (City Selection) */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '0 0 8px 0' }}>
                <Navigation
                    cityFilter={cityFilter}
                    handleCityClick={handleCityClick}
                />
            </div>

            {/* Icon Filters - SECOND */}
            <div style={{ marginBottom: '12px', width: '100%' }}>
                <FilterBar
                    topFloorFilter={topFloorFilter}
                    toggleTopFloor={toggleTopFloor}
                    favoritesOnly={favoritesOnly}
                    toggleFavoritesOnly={toggleFavoritesOnly}
                    iconFilters={iconFilters}
                    toggleIconFilter={toggleIconFilter}
                    viewingDateFilter={viewingDateFilter}
                    viewingDates={viewingDates}
                    setViewingDateFilter={setViewingDateFilter}
                    cityFilter={cityFilter}
                    sortAscending={sortAscending}
                    clearFilters={clearFilters}
                />
            </div>

            {/* Sorting - THIRD */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '8px' }}>
                <SortingControl
                    iconFilters={iconFilters}
                    toggleIconFilter={toggleIconFilter}
                />
            </div>

            {/* Results counter - only show when filtering reduces results */}
            {filteredCount !== undefined && totalCount !== undefined && filteredCount < totalCount && (
                <div className="results-counter" style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                </div>
            )}
        </div>
    );
};

export default SearchHeader;
