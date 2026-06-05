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
            <div style={{ marginBottom: '0', width: '100%' }}>
                <FilterBar />
            </div>


        </div>
    );
};

export default SearchHeader;
