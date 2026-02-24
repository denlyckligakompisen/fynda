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
    sortAscending,
    clearFilters
}) => {
    const isAllActive = !goodDealOnly && !topFloorFilter && !iconFilters.viewing;



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
                {/* "All" button */}
                <Chip
                    label="ALLA"
                    onClick={clearFilters}
                    sx={{
                        borderRadius: '8px',
                        flexShrink: 0,
                        backgroundColor: isAllActive ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.12)',
                        color: isAllActive ? '#fff' : 'var(--text-primary)',
                        border: 'none',
                        '&:hover': { backgroundColor: isAllActive ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.16)' },
                        '& .MuiChip-label': {
                            fontFamily: 'var(--font-family)',
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            fontSize: '0.8125rem'
                        }
                    }}
                />

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
                                <span className="fynda-hero-label">FYNDA</span>
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
                    sx={{
                        borderRadius: '8px',
                        flexShrink: 0,
                        backgroundColor: topFloorFilter ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.12)',
                        color: topFloorFilter ? '#fff' : 'var(--text-primary)',
                        border: 'none',
                        '&:hover': { backgroundColor: topFloorFilter ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.16)' },
                        '& .MuiChip-label': {
                            fontFamily: 'var(--font-family)',
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            fontSize: '0.8125rem'
                        }
                    }}
                />

                {/* Viewing */}
                <Chip
                    label="VISNING"
                    onClick={() => toggleIconFilter('viewing')}
                    color={iconFilters.viewing ? "primary" : "default"}
                    sx={{
                        borderRadius: '8px',
                        flexShrink: 0,
                        backgroundColor: iconFilters.viewing ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.12)',
                        color: iconFilters.viewing ? '#fff' : 'var(--text-primary)',
                        border: 'none',
                        '&:hover': { backgroundColor: iconFilters.viewing ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.16)' },
                        '& .MuiChip-label': {
                            fontFamily: 'var(--font-family)',
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            fontSize: '0.8125rem'
                        }
                    }}
                />
            </Stack>

            {/* Viewing Date Filter Row - ONLY visible when VISNING is active */}
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
                        sx={{
                            borderRadius: '6px',
                            flexShrink: 0,
                            backgroundColor: viewingDateFilter === null ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.08)',
                            color: viewingDateFilter === null ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            fontSize: '0.75rem',
                            height: '24px'
                        }}
                    />

                    {/* Dynamic date buttons */}
                    {viewingDates.map((item) => (
                        <Chip
                            key={item.key}
                            label={formatDateLabel(item.date).toUpperCase()}
                            onClick={() => setViewingDateFilter(viewingDateFilter === item.key ? null : item.key)}
                            sx={{
                                borderRadius: '6px',
                                flexShrink: 0,
                                backgroundColor: viewingDateFilter === item.key ? 'var(--nav-item-active)' : 'rgba(118, 118, 128, 0.08)',
                                color: viewingDateFilter === item.key ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                fontSize: '0.75rem',
                                height: '24px'
                            }}
                        />
                    ))}
                </Stack>
            )}


        </div>
    );
};

export default FilterBar;
