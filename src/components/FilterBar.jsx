/**
 * Filter icon bar component
 */
import { Box, Stack } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import { motion, AnimatePresence } from 'framer-motion';



const FilterBar = ({
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
    sortAscending,
    clearFilters
}) => {
    const isAllActive = !goodDealOnly && !topFloorFilter && !iconFilters.viewing;

    // Format date to Swedish short day label
    const formatDateLabel = (date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (targetDate.getTime() === today.getTime()) return 'Idag';
        if (targetDate.getTime() === tomorrow.getTime()) return 'Imorgon';

        const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
    };

    return (
        <div className="filter-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    overflowX: 'auto',
                    pb: 0.5,
                    width: '100%',
                    px: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    '::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                }}
            >
                <button
                    className={`app-filter-button ${isAllActive ? 'active' : ''}`}
                    onClick={clearFilters}
                >
                    Alla
                </button>

                <button
                    className={`app-filter-button ${goodDealOnly ? 'active' : ''}`}
                    onClick={toggleGoodDeal}
                >
                    Fynd
                </button>

                <button
                    className={`app-filter-button ${topFloorFilter ? 'active' : ''}`}
                    onClick={toggleTopFloor}
                >
                    Högst upp
                </button>

                <button
                    className={`app-filter-button ${iconFilters.viewing ? 'active' : ''}`}
                    onClick={() => toggleIconFilter('viewing')}
                >
                    Visning
                </button>
            </Stack>

            {/* Viewing Date Filter Row */}
            {iconFilters.viewing && viewingDates && viewingDates.length > 0 && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        overflowX: 'auto',
                        pb: 0.5,
                        width: '100%',
                        px: 2,
                        justifyContent: 'center',
                        '::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none'
                    }}
                >
                    <button
                        className={`app-filter-button ${viewingDateFilter === null ? 'active' : ''}`}
                        onClick={() => setViewingDateFilter(null)}
                        style={{ height: '28px', fontSize: '0.75rem', padding: '0 12px' }}
                    >
                        Alla datum
                    </button>

                    {viewingDates.map((item) => (
                        <button
                            key={item.key}
                            className={`app-filter-button ${viewingDateFilter === item.key ? 'active' : ''}`}
                            onClick={() => setViewingDateFilter(viewingDateFilter === item.key ? null : item.key)}
                            style={{ height: '28px', fontSize: '0.75rem', padding: '0 12px' }}
                        >
                            {formatDateLabel(item.date)}
                        </button>
                    ))}
                </Stack>
            )}
        </div>
    );
};

export default FilterBar;
