/**
 * Filter icon bar component
 */
import { Chip, Select, MenuItem, FormControl, InputLabel, Box, Stack } from '@mui/material';
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
                <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.7, marginRight: '4px' }}>FILTRERA</span>

                {/* Fyndchans Filter — MAXIMUM CRAZY Animation */}
                {(() => {
                    const particles = Array.from({ length: 12 }, (_, i) => {
                        const angle = (i / 12) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const distance = 40 + Math.random() * 30;
                        return { id: i, x: Math.cos(rad) * distance, y: Math.sin(rad) * distance, angle };
                    });
                    return (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            {/* Screen flash on activation */}
                            <AnimatePresence>
                                {goodDealOnly && (
                                    <motion.div
                                        key="flash"
                                        initial={{ opacity: 0.6 }}
                                        animate={{ opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        style={{
                                            position: 'fixed',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'radial-gradient(circle, rgba(59,141,153,0.3) 0%, transparent 70%)',
                                            pointerEvents: 'none',
                                            zIndex: 9999
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Particle burst */}
                            <AnimatePresence>
                                {goodDealOnly && particles.map(p => (
                                    <motion.div
                                        key={`p-${p.id}`}
                                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                        animate={{ opacity: 0, x: p.x, y: p.y, scale: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.7, ease: 'easeOut' }}
                                        style={{
                                            position: 'absolute',
                                            top: '50%', left: '50%',
                                            width: p.id % 3 === 0 ? 6 : 4,
                                            height: p.id % 3 === 0 ? 6 : 4,
                                            borderRadius: '50%',
                                            background: p.id % 2 === 0 ? '#4eb0bc' : '#00ff88',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}
                                    />
                                ))}
                            </AnimatePresence>

                            <motion.button
                                onClick={toggleGoodDeal}
                                className={`fynda-hero-btn ${goodDealOnly ? 'active' : ''}`}
                                whileTap={{ scale: 0.85, rotate: -2 }}
                                whileHover={{ scale: 1.08 }}
                                animate={goodDealOnly ? {
                                    boxShadow: [
                                        '0 0 0px rgba(59, 141, 153, 0)',
                                        '0 0 30px rgba(59, 141, 153, 0.8)',
                                        '0 0 60px rgba(78, 176, 188, 0.4)',
                                        '0 0 30px rgba(59, 141, 153, 0.8)',
                                        '0 0 0px rgba(59, 141, 153, 0)',
                                    ],
                                    scale: [1, 1.15, 1],
                                } : {
                                    boxShadow: '0 0 0px rgba(59, 141, 153, 0)',
                                    scale: 1
                                }}
                                transition={goodDealOnly ? {
                                    boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                                } : { duration: 0.3 }}
                            >
                                <span className="fynda-hero-label">✨ FYNDA</span>
                                {goodDealOnly && <span className="fynda-hero-shimmer" />}
                                {goodDealOnly && <span className="fynda-hero-shimmer delay" />}
                            </motion.button>
                        </div>
                    );
                })()}

                {/* Top Floor */}
                <Chip
                    label="HÖGST UPP"
                    onClick={toggleTopFloor}
                    color={topFloorFilter ? "primary" : "default"}
                    variant={topFloorFilter ? "filled" : "outlined"}
                    className={topFloorFilter ? '' : 'filter-chip-outlined'}
                    sx={{ borderRadius: '8px', border: topFloorFilter ? 'none' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0, '& .MuiChip-label': { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8125rem' } }}
                />

                {/* Viewing */}
                <Chip
                    label="VISNING"
                    onClick={() => toggleIconFilter('viewing')}
                    color={iconFilters.viewing ? "primary" : "default"}
                    variant={iconFilters.viewing ? "filled" : "outlined"}
                    sx={{ borderRadius: '8px', border: iconFilters.viewing ? 'none' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0, '& .MuiChip-label': { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8125rem' } }}
                />

                {/* Auction/Kronofogden */}
                <Chip
                    label="AUKTION"
                    onClick={() => toggleIconFilter('auktion')}
                    color={iconFilters.auktion ? "primary" : "default"}
                    variant={iconFilters.auktion ? "filled" : "outlined"}
                    sx={{ borderRadius: '8px', border: iconFilters.auktion ? 'none' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0, '& .MuiChip-label': { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8125rem' } }}
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
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            letterSpacing: '0.5px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '& .MuiSelect-select': {
                                padding: '6px 32px 6px 12px !important',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            },
                            '& .MuiSvgIcon-root': {
                                color: 'rgba(255, 255, 255, 0.5)',
                                right: '8px'
                            }
                        }}
                        renderValue={(selected) => {
                            const labels = {
                                newest: 'NYAST',
                                dealScore: 'FYNDA',
                                monthlyCost: 'MÅNADSKOSTNAD',
                                viewingSort: 'VISNING',
                                sqmPrice: 'KVM-PRIS'
                            };
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <SortRoundedIcon sx={{ fontSize: '1.1rem', opacity: 0.7 }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>{labels[selected] || selected.toUpperCase()}</span>
                                </div>
                            );
                        }}
                    >
                        <MenuItem value="dealScore" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>FYNDA</MenuItem>
                        <MenuItem value="sqmPrice" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>KVM-PRIS</MenuItem>
                        <MenuItem value="monthlyCost" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>MÅNADSKOSTNAD</MenuItem>
                        <MenuItem value="newest" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>NYAST</MenuItem>
                        <MenuItem value="viewingSort" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>VISNING</MenuItem>
                    </Select>
                </FormControl>
            </div>
        </div>
    );
};

export default FilterBar;
