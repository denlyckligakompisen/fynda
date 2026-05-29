import React, { createContext, useContext } from 'react';
import useFilters from '../hooks/useFilters';

const FilterContext = createContext();

export const FilterProvider = ({ children, data, favorites, toggleFavorite, isLoading }) => {
    const filterState = useFilters(data, favorites);

    const value = {
        ...filterState,
        allData: data,
        favorites,
        toggleFavorite,
        isLoading
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilterContext = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilterContext must be used within a FilterProvider');
    }
    return context;
};
