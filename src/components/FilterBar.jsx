/**
 * Filter icon bar component without Modal
 */
import { Box, Stack, Slider, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { calculateMonthlyCost } from '../utils/formatters';

const FilterBar = () => {
    const {
        favoritesOnly,
        toggleFavoritesOnly,
        iconFilters,
        toggleIconFilter,
        viewingDateFilter,
        viewingDates,
        setViewingDateFilter,
        minPossibleCost = 0,
        maxPossibleCost = 10000,
        maxMonthlyCostFilter,
        setMaxMonthlyCostFilter,
        municipalities = [],
        municipalityFilter,
        setMunicipalityFilter,
        allData = []
    } = useFilterContext();
    
    const [muniAnchor, setMuniAnchor] = useState(null);
    const [showCostFilters, setShowCostFilters] = useState(false);
    const [showViewingFilters, setShowViewingFilters] = useState(false);

    const costOptions = useMemo(() => {
        if (!allData || allData.length === 0) return [minPossibleCost, maxPossibleCost];
        
        const uniqueThousands = new Set();
        
        allData.forEach(item => {
            const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
            if (cost !== null) {
                const roundedUp = Math.ceil(cost / 1000) * 1000;
                uniqueThousands.add(roundedUp);
            }
        });
        
        const sorted = Array.from(uniqueThousands).sort((a, b) => a - b);
        return sorted.length > 0 ? sorted : [minPossibleCost, maxPossibleCost];
    }, [allData, minPossibleCost, maxPossibleCost]);

    const maxIndex = Math.max(0, costOptions.length - 1);
    const [localSliderIndex, setLocalSliderIndex] = useState(maxIndex);

    useEffect(() => {
        if (maxMonthlyCostFilter !== null) {
            let idx = costOptions.indexOf(maxMonthlyCostFilter);
            if (idx === -1) {
                idx = costOptions.findIndex(cost => cost >= maxMonthlyCostFilter);
                if (idx === -1) idx = maxIndex;
            }
            setLocalSliderIndex(idx);
        } else {
            setLocalSliderIndex(maxIndex);
        }
    }, [maxMonthlyCostFilter, costOptions, maxIndex]);

    const activeViewingDateItem = viewingDates?.find(item => item.key === viewingDateFilter);
    const viewingDateText = activeViewingDateItem ? formatDateLabel(activeViewingDateItem.date) : '';

    return (
        <div className="filter-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            
            <Box sx={{ width: '100%', px: 2, pb: 0.5, overflowX: 'auto', whiteSpace: 'nowrap', '::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 'max-content' }}>
                    <button
                        className={`app-filter-button ${favoritesOnly ? 'active' : ''}`}
                        onClick={toggleFavoritesOnly}
                        style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px', flexShrink: 0 }}
                    >
                        Favoriter
                    </button>

                    <button
                        className={`app-filter-button ${maxMonthlyCostFilter !== null ? 'active' : ''}`}
                        onClick={() => setShowCostFilters(!showCostFilters)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                    >
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px' }}>
                            Kostnad {maxMonthlyCostFilter !== null ? `(Max ${maxMonthlyCostFilter.toLocaleString('sv-SE')})` : ''}
                        </span>
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: 'inherit', transform: showCostFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                        className={`app-filter-button ${iconFilters.viewing ? 'active' : ''}`}
                        onClick={() => {
                            if (!showViewingFilters) {
                                setShowViewingFilters(true);
                            } else {
                                setShowViewingFilters(false);
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                    >
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px' }}>
                            Visningar {viewingDateText ? `(${viewingDateText})` : ''}
                        </span>
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: 'inherit', transform: showViewingFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                </Stack>
            </Box>

            {/* Viewing Date Filter (Conditional) */}
            {showViewingFilters && viewingDates && viewingDates.length > 0 && (
                <Box sx={{ width: '100%', px: 2, pb: 1, overflowX: 'auto', whiteSpace: 'nowrap', '::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', display: 'flex', justifyContent: 'flex-start' }}>
                    <Stack direction="row" spacing={1} sx={{ width: 'max-content' }}>
                        <button
                            className={`app-filter-button ${!iconFilters.viewing ? 'active' : ''}`}
                            onClick={() => {
                                if (iconFilters.viewing) toggleIconFilter('viewing');
                                setViewingDateFilter(null);
                            }}
                            style={{ height: '32px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '16px', flexShrink: 0 }}
                        >
                            Alla Datum
                        </button>
                        {viewingDates.map((item) => (
                            <button
                                key={item.key}
                                className={`app-filter-button ${viewingDateFilter === item.key ? 'active' : ''}`}
                                onClick={() => {
                                    if (viewingDateFilter === item.key) {
                                        if (iconFilters.viewing) toggleIconFilter('viewing');
                                        setViewingDateFilter(null);
                                    } else {
                                        if (!iconFilters.viewing) toggleIconFilter('viewing');
                                        setViewingDateFilter(item.key);
                                    }
                                }}
                                style={{ height: '32px', fontSize: '0.85rem', padding: '0 16px', borderRadius: '16px', flexShrink: 0 }}
                            >
                                {formatDateLabel(item.date)}
                            </button>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Cost Filter (Conditional) */}
            {showCostFilters && (
                <Box sx={{ width: '100%', px: 3, pb: 2, pt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                                {localSliderIndex === maxIndex ? 'Visa alla' : `${costOptions[localSliderIndex]?.toLocaleString('sv-SE')} kr`}
                            </Typography>
                        </Box>
                        <Slider
                            value={localSliderIndex}
                            min={0}
                            max={maxIndex}
                            step={1}
                            marks={true}
                            aria-label="Max månadskostnad"
                            onChange={(e, val) => setLocalSliderIndex(val)}
                            onChangeCommitted={(e, val) => {
                                if (val === maxIndex) {
                                    setMaxMonthlyCostFilter(null);
                                } else {
                                    setMaxMonthlyCostFilter(costOptions[val]);
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
                    </Box>
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


        </div>
    );
};

export default FilterBar;
