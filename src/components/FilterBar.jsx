/**
 * Filter icon bar component without Modal
 */
import { Box, Stack, Slider, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
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

import { useFilterContext } from '../context/FilterContext';

const FilterBar = ({ sortingComponent }) => {
    const {
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
        setMunicipalityFilter
    } = useFilterContext();
    
    const [localSliderValue, setLocalSliderValue] = useState(10000);
    const [muniAnchor, setMuniAnchor] = useState(null);
    const [costAnchor, setCostAnchor] = useState(null);

    useEffect(() => {
        if (maxMonthlyCostFilter !== null) {
            setLocalSliderValue(maxMonthlyCostFilter);
        } else {
            setLocalSliderValue(10000); // 10000+ is interpreted as 'All'
        }
    }, [maxMonthlyCostFilter]);

    return (
        <div className="filter-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            
            <Box sx={{ width: '100%', px: 2, pb: 0.5, overflowX: 'auto', whiteSpace: 'nowrap', '::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 'max-content', mx: 'auto' }}>
                    {sortingComponent}

                    <button
                        className={`app-filter-button ${iconFilters.viewing ? 'active' : ''}`}
                        onClick={() => {
                            toggleIconFilter('viewing');
                            if (iconFilters.viewing) setViewingDateFilter(null);
                        }}
                        style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px', flexShrink: 0 }}
                    >
                        Visningar
                    </button>

                    <button
                        className={`app-filter-button ${favoritesOnly ? 'active' : ''}`}
                        onClick={toggleFavoritesOnly}
                        style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px', flexShrink: 0 }}
                    >
                        Favoriter
                    </button>

                    {municipalities.length > 1 && (
                        <button
                            className={`app-filter-button ${municipalityFilter !== null ? 'active' : ''}`}
                            onClick={(e) => setMuniAnchor(e.currentTarget)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                        >
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px' }}>
                                Område {municipalityFilter && `: ${municipalityFilter}`}
                            </span>
                            <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: 'inherit' }} />
                        </button>
                    )}

                    <button
                        className={`app-filter-button ${maxMonthlyCostFilter !== null ? 'active' : ''}`}
                        onClick={(e) => setCostAnchor(e.currentTarget)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                    >
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px' }}>
                            Kostnad {maxMonthlyCostFilter !== null ? `(Max ${maxMonthlyCostFilter})` : ''}
                        </span>
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: 'inherit' }} />
                    </button>
                </Stack>
            </Box>

            {/* Viewing Date Filter (Conditional) */}
            {iconFilters.viewing && viewingDates && viewingDates.length > 0 && (
                <Box sx={{ width: '100%', px: 2, pb: 1, overflowX: 'auto', whiteSpace: 'nowrap', '::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    <Stack direction="row" spacing={1}>
                        <button
                            className={`app-filter-button ${viewingDateFilter === null ? 'active' : ''}`}
                            onClick={() => setViewingDateFilter(null)}
                            style={{ height: '32px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '16px', flexShrink: 0 }}
                        >
                            Alla Datum
                        </button>
                        {viewingDates.map((item) => (
                            <button
                                key={item.key}
                                className={`app-filter-button ${viewingDateFilter === item.key ? 'active' : ''}`}
                                onClick={() => setViewingDateFilter(viewingDateFilter === item.key ? null : item.key)}
                                style={{ height: '32px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '16px', flexShrink: 0 }}
                            >
                                {formatDateLabel(item.date)}
                            </button>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Municipality Menu */}
            <Menu
                anchorEl={muniAnchor}
                open={Boolean(muniAnchor)}
                onClose={() => setMuniAnchor(null)}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        mt: 1,
                        minWidth: 200,
                        maxHeight: 400,
                        boxShadow: 'var(--shadow-card)',
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid var(--border-color)'
                    }
                }}
            >
                <MenuItem 
                    onClick={() => { setMunicipalityFilter(null); setMuniAnchor(null); }}
                    sx={{ py: 1.5, px: 2 }}
                >
                    <ListItemText primary="Alla Kommuner" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: municipalityFilter === null ? 600 : 500 }} />
                    {municipalityFilter === null && <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}><CheckRoundedIcon sx={{ fontSize: 20, color: '#007aff' }} /></ListItemIcon>}
                </MenuItem>
                {municipalities.map((item) => (
                    <MenuItem 
                        key={item}
                        onClick={() => { setMunicipalityFilter(item); setMuniAnchor(null); }}
                        sx={{ py: 1.5, px: 2 }}
                    >
                        <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: municipalityFilter === item ? 600 : 500 }} />
                        {municipalityFilter === item && <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}><CheckRoundedIcon sx={{ fontSize: 20, color: '#007aff' }} /></ListItemIcon>}
                    </MenuItem>
                ))}
            </Menu>

            {/* Monthly Cost Menu */}
            <Menu
                anchorEl={costAnchor}
                open={Boolean(costAnchor)}
                onClose={() => setCostAnchor(null)}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        mt: 1,
                        width: 300,
                        p: 3,
                        boxShadow: 'var(--shadow-card)',
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid var(--border-color)'
                    }
                }}
            >
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
                        color: '#007aff',
                        height: 6,
                        '& .MuiSlider-thumb': {
                            width: 28, height: 28, backgroundColor: 'var(--text-primary)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        },
                        '& .MuiSlider-track': { border: 'none', height: 6 },
                        '& .MuiSlider-rail': { opacity: 0.2, backgroundColor: 'var(--text-secondary)', height: 6 }
                    }}
                />
            </Menu>
        </div>
    );
};

export default FilterBar;
