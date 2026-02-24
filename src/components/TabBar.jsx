import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import {
    MapRounded as MapRoundedIcon,
    FavoriteRounded as FavoriteRoundedIcon,
    InfoRounded as InfoRoundedIcon
} from '@mui/icons-material';

import SearchIcon from '@mui/icons-material/Search';

/**
 * Bottom navigation bar for mobile
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Autocomplete, TextField, InputAdornment, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

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
        { id: 'search', label: 'Lista', icon: <FormatListBulletedIcon className="tab-icon" /> },
        { id: 'map', label: 'Karta', icon: <MapRoundedIcon className="tab-icon" /> },
        { id: 'saved', label: 'Sparade', icon: <FavoriteRoundedIcon className="tab-icon" /> },
        { id: 'info', label: 'Info', icon: <InfoRoundedIcon className="tab-icon" /> }
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

            <div className={`tab-navigation-container ${isSearchExpanded ? 'search-active' : ''}`}>
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
                                className={`search-fab ${activeTab === 'search_focus' ? 'active' : ''}`}
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
                                background: 'rgba(255, 255, 255, 0.92)',
                                backdropFilter: 'blur(30px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                                borderRadius: '27px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 16px',
                                height: '54px',
                                zIndex: 1000,
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                                border: '0.5px solid rgba(0,0,0,0.1)'
                            }}
                        >
                            <SearchRoundedIcon sx={{ color: 'var(--text-tertiary)', fontSize: '20px' }} />
                            <Autocomplete
                                freeSolo
                                options={searchSuggestions}
                                value={searchQuery}
                                onInputChange={(e, val) => setSearchQuery(val)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        autoFocus
                                        placeholder="Sök adress..."
                                        variant="standard"
                                        InputProps={{ ...params.InputProps, disableUnderline: true }}
                                        sx={{ ml: 1, flex: 1, '& .MuiInputBase-input': { fontSize: '16px' } }}
                                    />
                                )}
                                sx={{ flex: 1 }}
                            />
                            <IconButton size="small" onClick={() => setIsSearchExpanded(false)}>
                                <CloseRoundedIcon sx={{ fontSize: '20px' }} />
                            </IconButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default TabBar;
