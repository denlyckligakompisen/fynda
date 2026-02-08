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
                <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.7, marginRight: '4px' }}>Filtrera:</span>

                {/* Top Floor */}
                <Chip
                    label="Högst upp"
                    onClick={toggleTopFloor}
                    color={topFloorFilter ? "primary" : "default"}
                    variant={topFloorFilter ? "filled" : "outlined"}
                    className={topFloorFilter ? '' : 'filter-chip-outlined'}
                    sx={{ borderRadius: '8px', border: topFloorFilter ? 'none' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
                />
            </Stack>

            {/* Sorting Row */}
            <div className="sorting-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '4px' }}>
                <FormControl size="small" variant="standard" sx={{ minWidth: 140 }}>
                    <Select
                        value={
                            iconFilters.dealScore ? 'dealScore' :
                                iconFilters.monthlyCost ? 'monthlyCost' :
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
                                monthlyCost: 'Månadskostnad'
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
                    </Select>
                </FormControl>
            </div>
        </div>
    );
};

export default FilterBar;
