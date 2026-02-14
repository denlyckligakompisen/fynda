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



            {/* Search Box - SECOND */}
            <div className="search-container" style={{ margin: '8px 0', padding: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div className="search-input-wrapper" style={{ overflow: 'visible', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
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
