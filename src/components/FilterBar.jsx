/**
 * Filter icon bar component
 */
const FilterBar = ({
    topFloorFilter,
    toggleTopFloor,
    iconFilters,
    toggleIconFilter,
    viewingDateFilter,
    viewingDates,
    setViewingDateFilter,
    cityFilter,
    sortAscending
}) => {
    // Format date to Swedish short day label (e.g., "Idag", "Imorgon", "Lör 15 feb")
    const formatDateLabel = (date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (targetDate.getTime() === today.getTime()) {
            return 'Idag';
        }
        if (targetDate.getTime() === tomorrow.getTime()) {
            return 'Imorgon';
        }

        const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        const dayName = dayNames[date.getDay()];
        return `${dayName} ${date.getDate()} ${monthNames[date.getMonth()]}`;
    };

    return (
        <div className="filter-bar-container">
            <div className="mobile-filters-row">
                {/* Top Floor */}
                <button
                    className={`filter-text-btn ${topFloorFilter ? 'active' : ''}`}
                    onClick={toggleTopFloor}
                >
                    Högst upp
                </button>

                {/* New */}
                <button
                    className={`filter-text-btn ${iconFilters.new ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('new')}
                >
                    Nytt
                </button>

                {/* Viewing */}
                <button
                    className={`filter-text-btn ${iconFilters.viewing ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('viewing')}
                >
                    Visning
                </button>

                {/* Bidding */}
                <button
                    className={`filter-text-btn ${iconFilters.bidding ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('bidding')}
                >
                    Budgivning
                </button>
            </div>

            {/* Viewing Date Filter Row - only visible when viewing filter is active */}
            {iconFilters.viewing && viewingDates && viewingDates.length > 0 && (
                <div className="viewing-date-filters-row">
                    {/* "All" button */}
                    <button
                        className={`filter-date-btn ${viewingDateFilter === null ? 'active' : ''}`}
                        onClick={() => setViewingDateFilter(null)}
                    >
                        Alla
                    </button>

                    {/* Dynamic date buttons */}
                    {viewingDates.map((item) => (
                        <button
                            key={item.key}
                            className={`filter-date-btn ${viewingDateFilter === item.key ? 'active' : ''}`}
                            onClick={() => setViewingDateFilter(viewingDateFilter === item.key ? null : item.key)}
                        >
                            {formatDateLabel(item.date)}
                        </button>
                    ))}
                </div>
            )}

            {/* Sorting Row */}
            <div className="sorting-row">
                <span className="sorting-label">Sortera:</span>
                <button
                    className={`filter-date-btn ${!iconFilters.dealScore && !iconFilters.monthlyCost ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('newest')}
                >
                    Nyaste
                </button>
                <button
                    className={`filter-date-btn ${iconFilters.dealScore ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('dealScore')}
                >
                    Fyndchans
                </button>
                <button
                    className={`filter-date-btn ${iconFilters.monthlyCost ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('monthlyCost')}
                >
                    Månadskostnad
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
