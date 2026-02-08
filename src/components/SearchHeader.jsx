import { Autocomplete, TextField, InputAdornment } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
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

            {/* Navigation (City/Area selection) - FIRST */}
            <Navigation
                cityFilter={cityFilter}
                handleCityClick={handleCityClick}
            />

            {/* Search Box - SECOND */}
            <div className="search-container">
                <div className="search-input-wrapper" style={{ overflow: 'visible' }}>
                    <Autocomplete
                        freeSolo
                        options={searchSuggestions}
                        value={searchQuery}
                        inputValue={searchQuery} // Explicitly control input value
                        open={searchQuery.length > 1 && searchSuggestions.length > 0 && isDropdownOpen}
                        onOpen={() => {
                            if (searchQuery.length > 1) setIsDropdownOpen(true);
                        }}
                        onClose={() => setIsDropdownOpen(false)}
                        onInputChange={(event, newInputValue, reason) => {
                            setSearchQuery(newInputValue);
                            if (reason === 'input' && newInputValue.length > 1) {
                                setIsDropdownOpen(true);
                            } else if (reason === 'clear' || newInputValue.length <= 1) {
                                setIsDropdownOpen(false);
                            }
                        }}
                        onChange={(event, newValue) => {
                            // Selection made
                            setIsDropdownOpen(false);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Sök adress eller område..."
                                size="small"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setIsDropdownOpen(false);
                                        e.target.blur();
                                    }
                                }}
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ pl: 1 }}>
                                            <span className="material-symbols-outlined search-icon" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)' }}>search</span>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: '24px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        color: '#fff',
                                        '& fieldset': { border: 'none' },
                                        '& .MuiInputBase-input': { padding: '8px 0' }
                                    }
                                }}
                            />
                        )}
                        sx={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Icon Filters - THIRD */}
            <FilterBar
                topFloorFilter={topFloorFilter}
                toggleTopFloor={toggleTopFloor}
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
