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
    goodDealOnly,
    toggleGoodDeal,
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
    searchSuggestions = []
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="search-header-group">

            {/* Navigation and Sorting Row */}
            {/* Navigation (City/Area selection) - FIRST, CENTERED */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '0px' }}>
                <Navigation
                    cityFilter={cityFilter}
                    handleCityClick={handleCityClick}
                />
            </div>





            {/* Sorting - THIRD, CENTERED */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '16px', marginBottom: '16px' }}>
                <SortingControl
                    iconFilters={iconFilters}
                    toggleIconFilter={toggleIconFilter}
                />
            </div>

            {/* Icon Filters - THIRD */}
            <FilterBar
                topFloorFilter={topFloorFilter}
                toggleTopFloor={toggleTopFloor}
                goodDealOnly={goodDealOnly}
                toggleGoodDeal={toggleGoodDeal}
                iconFilters={iconFilters}
                toggleIconFilter={toggleIconFilter}
                viewingDateFilter={viewingDateFilter}
                viewingDates={viewingDates}
                setViewingDateFilter={setViewingDateFilter}
                cityFilter={cityFilter}
                sortAscending={sortAscending}
            />
        </div>
    );
};

export default SearchHeader;
