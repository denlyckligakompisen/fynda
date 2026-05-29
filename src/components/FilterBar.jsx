/**
 * Filter icon bar component with iOS-style Bottom Sheet
 */
import { Box, Stack, Slider, Typography, SwipeableDrawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IosSwitch from './IosSwitch';
import { useState, useEffect } from 'react';

// Format date to Swedish short day label
const formatDateLabel = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const monthNames = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
    const monthStr = `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;

    if (targetDate.getTime() === today.getTime()) return 'Idag';
    if (targetDate.getTime() === tomorrow.getTime()) return 'Imorgon';

    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 8 && diffDays > 0) {
        return dayNames[date.getDay()];
    }
    return monthStr;
};

const FilterBar = ({
    favoritesOnly,
    toggleFavoritesOnly,
    iconFilters,
    toggleIconFilter,
    viewingDateFilter,
    viewingDates,
    setViewingDateFilter,
    maxMonthlyCostFilter,
    setMaxMonthlyCostFilter,
    municipalities = [],
    municipalityFilter,
    setMunicipalityFilter,
    sortingComponent
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [localSliderValue, setLocalSliderValue] = useState(10000);

    const isAllActive = !favoritesOnly && !iconFilters.viewing && maxMonthlyCostFilter === null && municipalityFilter === null && viewingDateFilter === null;

    useEffect(() => {
        if (maxMonthlyCostFilter !== null) {
            setLocalSliderValue(maxMonthlyCostFilter);
        } else {
            setLocalSliderValue(10000); // 10000+ is interpreted as 'All'
        }
    }, [maxMonthlyCostFilter]);

    // Derived iOS handle for the drawer
    const Puller = () => (
        <Box
            sx={{
                width: 36,
                height: 5,
                backgroundColor: 'var(--border-color)',
                borderRadius: 3,
                mx: 'auto',
                mt: 1.5,
                mb: 1
            }}
        />
    );

    return (
        <div className="filter-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', px: 2, pb: 0.5, flexWrap: 'wrap' }}>
                {sortingComponent}

                <button
                    className={`app-filter-button ${!isAllActive ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <FilterListRoundedIcon fontSize="small" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px' }}>Filter</span>
                </button>
            </Box>

            <SwipeableDrawer
                anchor="bottom"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onOpen={() => setDrawerOpen(true)}
                disableSwipeToOpen
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        maxHeight: '90vh',
                        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
                    }
                }}
            >
                <Puller />

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.3px' }}>
                        Filtrera
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ bgcolor: 'var(--badge-bg)' }} aria-label="Stäng filter">
                        <CloseRoundedIcon fontSize="small" sx={{ color: 'var(--text-primary)' }} />
                    </IconButton>
                </Box>

                <Box sx={{ mb: 2, height: '1px', backgroundColor: 'var(--border-color)' }} />

                {/* Content */}
                <Box sx={{ px: 3, pb: 4, overflowY: 'auto' }}>

                    <List disablePadding>
                        <ListItem disablePadding sx={{ py: 1.5 }}>
                            <ListItemText
                                primary="Favoriter"
                                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem', color: 'var(--text-primary)' }}
                            />
                            <IosSwitch
                                checked={!!favoritesOnly}
                                onChange={toggleFavoritesOnly}
                                color="primary"
                                inputProps={{ 'aria-label': 'Visa endast favoriter' }}
                            />
                        </ListItem>

                        <Box sx={{ height: '1px', backgroundColor: 'var(--border-color)' }} />



                        <ListItem disablePadding sx={{ py: 1.5 }}>
                            <ListItemText
                                primary="Kommande visningar"
                                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem', color: 'var(--text-primary)' }}
                            />
                            <IosSwitch
                                checked={!!iconFilters.viewing}
                                onChange={() => {
                                    toggleIconFilter('viewing');
                                    // Optionally clear viewing date if toggled off
                                    if (iconFilters.viewing) setViewingDateFilter(null);
                                }}
                                color="primary"
                                inputProps={{ 'aria-label': 'Visa endast kommande visningar' }}
                            />
                        </ListItem>
                    </List>

                    {/* Viewing Date Filter (Conditional) */}
                    {iconFilters.viewing && viewingDates && viewingDates.length > 0 && (
                        <Box sx={{ mt: 1, mb: 2, ml: -1, pl: 1, pb: 1, overflowX: 'auto', whiteSpace: 'nowrap', '::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                            <Stack direction="row" spacing={1}>
                                <button
                                    className={`app-filter-button ${viewingDateFilter === null ? 'active' : ''}`}
                                    onClick={() => setViewingDateFilter(null)}
                                    style={{ height: '32px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '16px' }}
                                >
                                    Alla Datum
                                </button>
                                {viewingDates.map((item) => (
                                    <button
                                        key={item.key}
                                        className={`app-filter-button ${viewingDateFilter === item.key ? 'active' : ''}`}
                                        onClick={() => setViewingDateFilter(viewingDateFilter === item.key ? null : item.key)}
                                        style={{ height: '32px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '16px' }}
                                    >
                                        {formatDateLabel(item.date)}
                                    </button>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    <Box sx={{ my: 2.5, height: '1px', backgroundColor: 'var(--border-color)' }} />

                    {/* Monthly Cost */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                Max Månadskostnad
                            </Typography>
                            <Typography sx={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                {maxMonthlyCostFilter === null ? 'Visa alla' : `${localSliderValue.toLocaleString('sv-SE')} kr`}
                            </Typography>
                        </Box>

                        <Slider
                            value={localSliderValue}
                            min={0}
                            max={10000}
                            step={1000}
                            marks={false}
                            aria-label="Max månadskostnad"
                            onChange={(e, val) => setLocalSliderValue(val)}
                            onChangeCommitted={(e, val) => {
                                if (val >= 10000) {
                                    setMaxMonthlyCostFilter(null);
                                } else {
                                    setMaxMonthlyCostFilter(val);
                                }
                            }}
                            sx={{
                                color: '#007aff', // iOS Blue
                                height: 6,
                                '& .MuiSlider-thumb': {
                                    width: 28,
                                    height: 28,
                                    backgroundColor: 'var(--text-primary)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
                                    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1)',
                                        // reset on touch devices
                                        '@media (hover: none)': {
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
                                        },
                                    },
                                },
                                '& .MuiSlider-track': {
                                    border: 'none',
                                    height: 6,
                                },
                                '& .MuiSlider-rail': {
                                    opacity: 0.2,
                                    backgroundColor: 'var(--text-secondary)',
                                    height: 6,
                                }
                            }}
                        />
                    </Box>

                    {/* Municipalities */}
                    {municipalities.length > 1 && (
                        <>
                            <Box sx={{ my: 2.5, height: '1px', backgroundColor: 'var(--border-color)' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                Område / Kommun
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <button
                                    className={`app-filter-button ${municipalityFilter === null ? 'active' : ''}`}
                                    onClick={() => setMunicipalityFilter(null)}
                                    style={{ height: '36px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '18px' }}
                                >
                                    Alla Kommuner
                                </button>
                                {municipalities.map((item) => (
                                    <button
                                        key={item}
                                        className={`app-filter-button ${municipalityFilter === item ? 'active' : ''}`}
                                        onClick={() => setMunicipalityFilter(municipalityFilter === item ? null : item)}
                                        style={{ height: '36px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '18px' }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </Box>
                        </>
                    )}

                </Box>
            </SwipeableDrawer>
        </div>
    );
};

export default FilterBar;
