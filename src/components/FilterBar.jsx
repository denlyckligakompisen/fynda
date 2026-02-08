/**
 * Filter icon bar component
 */
import { Chip, Select, MenuItem, FormControl, InputLabel, Box, Stack } from '@mui/material';

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
        <div className="filter-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    overflowX: 'auto',
                    pb: 0.5,
                    width: '100%',
                    px: 2, // Padding to prevent cutoff
                    justifyContent: { xs: 'flex-start', sm: 'center' }, // Left align on mobile, center on desktop
                    alignItems: 'center',
                    '::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                }}
            >
                <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.7, marginRight: '4px' }}>FILTRERA:</span>

                {/* Top Floor */}
                <Chip
                    label="HÖGST UPP"
                    onClick={toggleTopFloor}
                    color={topFloorFilter ? "primary" : "default"}
                    variant={topFloorFilter ? "filled" : "outlined"}
                    className={topFloorFilter ? '' : 'filter-chip-outlined'}
                    sx={{ borderRadius: '8px', border: topFloorFilter ? 'none' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
                />

                {/* Viewing */}
                <Chip
                    label="VISNING"
                    onClick={() => toggleIconFilter('viewing')}
                    color={iconFilters.viewing ? "primary" : "default"}
                    variant={iconFilters.viewing ? "filled" : "outlined"}
                    sx={{ borderRadius: '8px', border: iconFilters.viewing ? 'none' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
                />
            </Stack>

            {/* Viewing Date Filter Row - only visible when viewing filter is active */}
            {iconFilters.viewing && viewingDates && viewingDates.length > 0 && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        overflowX: 'auto',
                        pb: 0.5,
                        width: '100%',
                        px: 2,
                        flexShrink: 0,
                        justifyContent: { xs: 'flex-start', sm: 'center' }, // Left align on mobile, center on desktop
                        '::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none'
                    }}
                >
                    {/* "All" button */}
                    <Chip
                        label="ALLA"
                        onClick={() => setViewingDateFilter(null)}
                        color={viewingDateFilter === null ? "primary" : "default"}
                        variant={viewingDateFilter === null ? "filled" : "outlined"}
                        size="small"
                        sx={{ borderRadius: '6px', flexShrink: 0 }}
                    />

                    {/* Dynamic date buttons */}
                    {viewingDates.map((item) => (
                        <Chip
                            key={item.key}
                            label={formatDateLabel(item.date).toUpperCase()}
                            onClick={() => setViewingDateFilter(viewingDateFilter === item.key ? null : item.key)}
                            color={viewingDateFilter === item.key ? "primary" : "default"}
                            variant={viewingDateFilter === item.key ? "filled" : "outlined"}
                            size="small"
                            sx={{ borderRadius: '6px', flexShrink: 0 }}
                        />
                    ))}
                </Stack>
            )}

            {/* Sorting Row */}
            <div className="sorting-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '4px' }}>
                <FormControl size="small" variant="standard" sx={{ minWidth: 140 }}>
                    <Select
                        value={
                            iconFilters.dealScore ? 'dealScore' :
                                iconFilters.monthlyCost ? 'monthlyCost' :
                                    iconFilters.viewingSort ? 'viewingSort' :
                                        'newest'
                        }
                        onChange={(e) => toggleIconFilter(e.target.value)}
                        displayEmpty
                        disableUnderline
                        sx={{
                            color: 'text.primary',
                            fontSize: '0.9rem',
                            '& .MuiSelect-select': {
                                paddingRight: '24px !important',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }
                        }}
                        renderValue={(selected) => {
                            const labels = {
                                newest: 'Nyast',
                                dealScore: 'Fyndchans',
                                monthlyCost: 'Månadskostnad',
                                viewingSort: 'Visning'
                            };
                            return (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ opacity: 0.7, marginRight: 6 }}>Sortera:</span>
                                    <span style={{ fontWeight: 500 }}>{labels[selected] || selected}</span>
                                </div>
                            );
                        }}
                    >
                        <MenuItem value="newest">Nyast</MenuItem>
                        <MenuItem value="dealScore">Fyndchans</MenuItem>
                        <MenuItem value="monthlyCost">Månadskostnad</MenuItem>
                        <MenuItem value="viewingSort">Visning</MenuItem>
                    </Select>
                </FormControl>
            </div>
        </div>
    );
};

export default FilterBar;
