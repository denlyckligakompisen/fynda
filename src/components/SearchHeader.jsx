import { Autocomplete, TextField, InputAdornment } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
                        inputValue={searchQuery || ''}
                        open={searchQuery.length > 1 && isDropdownOpen}
                        onOpen={() => {
                            if (searchQuery.length > 1) setIsDropdownOpen(true);
                        }}
                        onClose={() => setIsDropdownOpen(false)}
                        filterOptions={(options, { inputValue }) => {
                            const query = (inputValue || '').toLowerCase().trim();
                            if (query.length <= 1) return [];
                            return options.filter(option =>
                                (option || '').toLowerCase().includes(query)
                            );
                        }}
                        onInputChange={(event, newInputValue, reason) => {
                            // Only update if the user is typing or clearing
                            // 'reset' reason comes from blur/focus/selection and can be unreliable
                            if (reason === 'input' || reason === 'clear') {
                                setSearchQuery(newInputValue);
                                if (newInputValue.length > 1) {
                                    setIsDropdownOpen(true);
                                } else {
                                    setIsDropdownOpen(false);
                                }
                            }
                        }}
                        onChange={(event, newValue) => {
                            // This triggers when an item is selected from the list
                            if (typeof newValue === 'string') {
                                setSearchQuery(newValue);
                            }
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
                                        <InputAdornment position="start" sx={{ pl: 1.5 }}>
                                            <SearchRoundedIcon sx={{ fontSize: '22px', color: 'rgba(255,255,255,0.6)' }} />
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
