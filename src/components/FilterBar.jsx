/**
 * Filter icon bar component
 */
import { Box, Stack, Slider, Typography, Menu, MenuItem, Checkbox, ListItemText } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import { motion, AnimatePresence } from 'framer-motion';
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
    topFloorFilter,
    toggleTopFloor,
    favoritesOnly,
    toggleFavoritesOnly,
    iconFilters,
    toggleIconFilter,
    viewingDateFilter,
    viewingDates,
    setViewingDateFilter,
    cityFilter,
    sortAscending,
    clearFilters,
    maxMonthlyCostFilter,
    setMaxMonthlyCostFilter,
    municipalities = [],
    municipalityFilter,
    setMunicipalityFilter,
    sortingComponent
}) => {
    const [showCostSlider, setShowCostSlider] = useState(false);
    const [localSliderValue, setLocalSliderValue] = useState(10000);

    const [anchorEl, setAnchorEl] = useState(null);

    const isAllActive = !topFloorFilter && !favoritesOnly && !iconFilters.viewing && maxMonthlyCostFilter === null && !showCostSlider;

    useEffect(() => {
        if (maxMonthlyCostFilter !== null) {
            setLocalSliderValue(maxMonthlyCostFilter);
            setShowCostSlider(true);
        } else {
            setLocalSliderValue(10000); // 10000+ is interpreted as 'All'
        }
    }, [maxMonthlyCostFilter]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className="filter-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', px: 2, pb: 0.5, flexWrap: 'wrap' }}>
                {sortingComponent}
                
                <button
                    className={`app-filter-button ${!isAllActive ? 'active' : ''}`}
                    onClick={handleMenuOpen}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <FilterListRoundedIcon fontSize="small" />
                    Filtrera {!isAllActive ? '(Aktiv)' : ''}
                </button>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        minWidth: '200px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={() => { clearFilters(); handleMenuClose(); }}>
                    <ListItemText primary="Alla (Rensa filter)" />
                </MenuItem>
                
                <MenuItem onClick={toggleFavoritesOnly}>
                    <Checkbox checked={!!favoritesOnly} size="small" />
                    <ListItemText primary="Favoriter" />
                </MenuItem>

                <MenuItem onClick={toggleTopFloor}>
                    <Checkbox checked={!!topFloorFilter} size="small" />
                    <ListItemText primary="Högst upp" />
                </MenuItem>

                <MenuItem onClick={() => {
                    if (showCostSlider || maxMonthlyCostFilter !== null) {
                        setShowCostSlider(false);
                        setMaxMonthlyCostFilter(null);
                    } else {
                        setShowCostSlider(true);
                    }
                }}>
                    <Checkbox checked={showCostSlider || maxMonthlyCostFilter !== null} size="small" />
                    <ListItemText primary="Månadskostnad" />
                </MenuItem>

                <MenuItem onClick={() => toggleIconFilter('viewing')}>
                    <Checkbox checked={!!iconFilters.viewing} size="small" />
                    <ListItemText primary="Visning" />
                </MenuItem>
            </Menu>

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
                        justifyContent: { xs: 'flex-start', md: 'center' },
                        '::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none'
                    }}
                >
                    <button
                        className={`app-filter-button ${viewingDateFilter === null ? 'active' : ''}`}
                        onClick={() => setViewingDateFilter(null)}
                        style={{ height: '28px', fontSize: '0.75rem', padding: '0 12px' }}
                    >
                        ALLA
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

            {/* Municipalities Filter Row */}
            {municipalities.length > 1 && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        overflowX: 'auto',
                        pb: 0.5,
                        width: '100%',
                        px: 2,
                        justifyContent: { xs: 'flex-start', md: 'center' },
                        '::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none'
                    }}
                >
                    <button
                        className={`app-filter-button ${municipalityFilter === null ? 'active' : ''}`}
                        onClick={() => setMunicipalityFilter(null)}
                        style={{ height: '28px', fontSize: '0.75rem', padding: '0 12px' }}
                    >
                        ALLA KOMMUNER
                    </button>

                    {municipalities.map((item) => (
                        <button
                            key={item}
                            className={`app-filter-button ${municipalityFilter === item ? 'active' : ''}`}
                            onClick={() => setMunicipalityFilter(municipalityFilter === item ? null : item)}
                            style={{ height: '28px', fontSize: '0.75rem', padding: '0 12px' }}
                        >
                            {item.toUpperCase()}
                        </button>
                    ))}
                </Stack>
            )}

            {/* Monthly Cost Slider Row */}
            {showCostSlider && (
                <Box sx={{ width: '100%', px: 4, pt: 1, pb: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', alignSelf: 'center', mb: 1, fontWeight: 500 }}>
                        Max månadskostnad: {maxMonthlyCostFilter === null ? 'Visa alla' : `${localSliderValue.toLocaleString('sv-SE')} kr`}
                    </Typography>
                    <Slider
                        value={localSliderValue}
                        min={0}
                        max={10000}
                        step={1000}
                        marks={true}
                        onChange={(e, val) => setLocalSliderValue(val)}
                        onChangeCommitted={(e, val) => {
                            if (val >= 10000) {
                                setMaxMonthlyCostFilter(null);
                            } else {
                                setMaxMonthlyCostFilter(val);
                            }
                        }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(val) => val >= 10000 ? 'Alla' : `${val.toLocaleString('sv-SE')} kr`}
                        sx={{
                            color: 'var(--accent-color, #1976d2)',
                            maxWidth: '400px',
                            '& .MuiSlider-thumb': {
                                width: 24,
                                height: 24,
                                backgroundColor: '#fff',
                                border: '2px solid currentColor'
                            },
                        }}
                    />
                </Box>
            )}
        </div>
    );
};

export default FilterBar;
