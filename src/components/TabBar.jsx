import {
    ListAltOutlined as ListAltOutlinedIcon,
    ListAltRounded as ListAltRoundedIcon,
    MapOutlined as MapOutlinedIcon,
    MapRounded as MapRoundedIcon,
    FavoriteBorderRounded as FavoriteBorderIcon,
    FavoriteRounded as FavoriteIcon,
    InfoOutlined as InfoOutlinedIcon,
    InfoRounded as InfoRoundedIcon,
    SearchRounded as SearchRoundedIcon,
    CloseRounded as CloseRoundedIcon
} from '@mui/icons-material';

/**
 * Bottom navigation bar for mobile
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Autocomplete, TextField, InputAdornment, IconButton } from '@mui/material';

/**
 * Bottom navigation bar for mobile with expandable search
 */
const TabBar = ({
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    searchSuggestions = []
}) => {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const searchInputRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const tabs = [
        {
            id: 'search',
            label: 'Lista',
            icon: activeTab === 'search' ? <ListAltRoundedIcon className="tab-icon" /> : <ListAltOutlinedIcon className="tab-icon" />
        },
        {
            id: 'map',
            label: 'Karta',
            icon: activeTab === 'map' ? <MapRoundedIcon className="tab-icon" /> : <MapOutlinedIcon className="tab-icon" />
        },
        {
            id: 'saved',
            label: 'Sparade',
            icon: activeTab === 'saved' ? <FavoriteIcon className="tab-icon" /> : <FavoriteBorderIcon className="tab-icon" />
        },
        {
            id: 'info',
            label: 'Info',
            icon: activeTab === 'info' ? <InfoRoundedIcon className="tab-icon" /> : <InfoOutlinedIcon className="tab-icon" />
        }
    ];

    const searchContainerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isSearchExpanded && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                // Prevent closing if clicking inside the MUI Autocomplete Popper (dropdown) or clear button
                if (event.target.closest('.MuiAutocomplete-popper')) return;
                if (event.target.closest('.MuiAutocomplete-clearIndicator')) return;

                setIsSearchExpanded(false);
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside); // For mobile

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isSearchExpanded]);

    const handleSearchClick = () => {
        if (!isSearchExpanded) {
            setIsSearchExpanded(true);
            handleTabChange('search_focus'); // Switch to search view when opening
            // Focus happens via autoFocus on TextField or effect
        }
    };

    const handleCloseSearch = (e) => {
        e.stopPropagation();
        setIsSearchExpanded(false);
        setSearchQuery(''); // Optional: clear search on close? Maybe not.
        setIsDropdownOpen(false);
    };

    // Determine if search is active (has text) to highlight the icon
    const isSearchActive = searchQuery && searchQuery.length > 0;

    const [keyboardOffset, setKeyboardOffset] = useState(0);

    // Dynamic positioning for keyboard on mobile
    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const handleViewportChange = () => {
            const viewport = window.visualViewport;
            const offset = window.innerHeight - viewport.height;
            // Only apply offset if search is expanded (keyboard likely out)
            setKeyboardOffset(offset > 0 ? offset : 0);
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);

        return () => {
            window.visualViewport.removeEventListener('resize', handleViewportChange);
            window.visualViewport.removeEventListener('scroll', handleViewportChange);
        };
    }, []);

    const containerBottom = isSearchExpanded
        ? `calc(${keyboardOffset}px + 12px)`
        : activeTab === 'search_focus' ? '24px' : '24px';

    return (
        <>
            {/* Click-outside backdrop for search */}
            <AnimatePresence>
                {isSearchExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSearchExpanded(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                            background: 'rgba(0,0,0,0.02)', // Extremely subtle dimming
                            backdropFilter: 'blur(2px)' // Slight blur to background content
                        }}
                    />
                )}
            </AnimatePresence>

            <div
                className={`tab-navigation-container ${isSearchExpanded ? 'search-active' : ''}`}
                style={{
                    bottom: containerBottom,
                    transition: 'bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <AnimatePresence mode="popLayout">
                    {!isSearchExpanded ? (
                        <motion.div
                            key="nav-elements"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                            {/* Navigation Tabs Pill */}
                            <nav className="tab-bar">
                                {tabs.filter(t => t.id !== 'search_focus').map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => handleTabChange(tab.id)}
                                    >
                                        {tab.icon}
                                    </button>
                                ))}
                            </nav>

                            {/* Separate Search Floating Button */}
                            <button
                                className={`search-fab ${activeTab === 'search_focus' ? 'active' : ''} ${isSearchActive ? 'has-query' : ''}`}
                                onClick={() => {
                                    setIsSearchExpanded(true);
                                    handleTabChange('search_focus');
                                }}
                            >
                                <SearchRoundedIcon sx={{ fontSize: '24px' }} />
                            </button>
                        </motion.div>
                    ) : (
                        /* Expandable Search Overlay (iOS 26 Full-pill expansion) */
                        <motion.div
                            ref={searchContainerRef}
                            key="search-overlay"
                            initial={{ opacity: 0, width: '54px' }}
                            animate={{ opacity: 1, width: '100vw', maxWidth: '500px' }}
                            exit={{ opacity: 0, width: '54px' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{
                                background: 'radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(255, 255, 255, 0.05) 0, transparent 50%), rgba(28, 28, 30, 0.92)',
                                backdropFilter: 'blur(40px) saturate(250%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(250%)',
                                borderRadius: '27px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 16px',
                                height: '54px',
                                zIndex: 1000,
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                border: '0.5px solid rgba(255, 255, 255, 0.25)'
                            }}
                        >
                            <SearchRoundedIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '20px' }} />
                            <Autocomplete
                                freeSolo
                                disableClearable
                                options={searchSuggestions}
                                value={searchQuery}
                                onInputChange={(e, val) => setSearchQuery(val)}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            bgcolor: 'rgba(28, 28, 30, 0.95)',
                                            backdropFilter: 'blur(20px)',
                                            color: '#ffffff',
                                            borderRadius: '16px',
                                            mt: 1,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            '& .MuiAutocomplete-option': {
                                                fontSize: '0.9rem',
                                                padding: '12px 16px',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                                            },
                                            '& .MuiAutocomplete-option.Mui-focused': {
                                                bgcolor: 'rgba(255, 255, 255, 0.15)'
                                            }
                                        }
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        autoFocus
                                        placeholder="Sök adress..."
                                        variant="standard"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Escape') {
                                                setIsSearchExpanded(false);
                                            }
                                        }}
                                        InputProps={{ ...params.InputProps, disableUnderline: true }}
                                        sx={{
                                            ml: 1,
                                            flex: 1,
                                            '& .MuiInputBase-input': {
                                                fontSize: '16px',
                                                color: '#ffffff'
                                            },
                                            '& .MuiInputBase-input::placeholder': {
                                                color: 'rgba(255, 255, 255, 0.4)',
                                                opacity: 1
                                            }
                                        }}
                                    />
                                )}
                                sx={{ flex: 1 }}
                            />
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}>
                                <CloseRoundedIcon sx={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
                            </IconButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default TabBar;
