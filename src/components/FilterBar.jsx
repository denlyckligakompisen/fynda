/**
 * Filter icon bar component
 */
const FilterBar = ({
    topFloorFilter,
    toggleTopFloor,
    iconFilters,
    toggleIconFilter,
    cityFilter
}) => {
    return (
        <div className="mobile-filters-row">
            {/* Top Floor */}
            <button
                className={`filter-icon-btn ${topFloorFilter ? 'active' : ''}`}
                onClick={toggleTopFloor}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z" /></svg>
            </button>


            <button
                className={`filter-icon-btn ${iconFilters.new ? 'active' : ''}`}
                onClick={() => toggleIconFilter('new')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-400q0 52 21 98.5t60 81.5q-1-5-1-9v-9q0-32 12-60t35-51l113-111 113 111q23 23 35 51t12 60v9q0 4-1 9 39-35 60-81.5t21-98.5q0-50-18.5-94.5T648-574q-20 13-42 19.5t-45 6.5q-62 0-107.5-41T401-690q-39 33-69 68.5t-50.5 72Q261-513 250.5-475T240-400Zm240 52-57 56q-11 11-17 25t-6 29q0 32 23.5 55t56.5 23q33 0 56.5-23t23.5-55q0-16-6-29.5T537-292l-57-56Zm0-492v132q0 34 23.5 57t57.5 23q18 0 33.5-7.5T622-658l18-22q74 42 117 117t43 163q0 134-93 227T480-80q-134 0-227-93t-93-227q0-129 86.5-245T480-840Z" /></svg>
            </button>

            {/* Viewing */}
            <button
                className={`filter-icon-btn ${iconFilters.viewing ? 'active' : ''}`}
                onClick={() => toggleIconFilter('viewing')}
            >
                <span className="material-symbols-outlined">calendar_month</span>
            </button>

            {/* Bidding */}
            <button
                className={`filter-icon-btn ${iconFilters.bidding ? 'active' : ''}`}
                onClick={() => toggleIconFilter('bidding')}
            >
                <span className="material-symbols-outlined">gavel</span>
            </button>

        </div>
    );
};

export default FilterBar;
