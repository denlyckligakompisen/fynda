import { useState } from 'react';
import FilterBar from './FilterBar';
import { useFilterContext } from '../context/FilterContext';

/**
 * Reusable header component for search, filtering and navigation
 */
const SearchHeader = ({ showSorting = true }) => {
    const { filteredData, allData } = useFilterContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredCount = filteredData?.length || 0;
    const totalCount = allData?.length || 0;

    return (
        <div className="search-header-group">
            {/* Icon Filters */}
            <div style={{ marginBottom: '12px', width: '100%' }}>
                <FilterBar />
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
