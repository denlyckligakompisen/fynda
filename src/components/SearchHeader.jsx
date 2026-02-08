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
                        onInputChange={(event, newInputValue) => {
                            setSearchQuery(newInputValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Sök adress eller område..."
                                size="small"
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
