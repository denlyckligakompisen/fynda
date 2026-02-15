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
        <div className={`tab-navigation-container ${isSearchExpanded ? 'search-active' : ''}`}>
            <AnimatePresence mode="wait">
                {!isSearchExpanded && (
                    <motion.nav
                        className="tab-bar"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        key="nav-bar"
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                            >
                                {tab.icon}
                            </button>
                        ))}
                    </motion.nav>
                )}
            </AnimatePresence>

            <motion.div
                ref={searchContainerRef}
                className={`search-fab-container ${isSearchExpanded ? 'expanded' : ''} ${isSearchActive && !isSearchExpanded ? 'has-query' : ''}`}
                layout
                initial={false}
                animate={{
                    width: isSearchExpanded ? 'calc(100vw - 32px)' : '56px',
                    borderRadius: isSearchExpanded ? '28px' : '50%',
                    backgroundColor: 'var(--nav-bg)', // match nav bg
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'relative',
                    maxWidth: '500px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSearchExpanded ? 'flex-start' : 'center',
                    overflow: 'hidden',
                    zIndex: 1001,
                    boxShadow: 'var(--shadow-nav)',
                    border: isSearchActive && !isSearchExpanded ? '1px solid var(--teal-accent)' : '1px solid var(--border-color)', // Highlight border if active
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    // Override default transform from CSS for animation control
                    // But we used CSS class for translateY. Let's handle it here or keep class.
                    // The CSS class .search-fab has styling. We might need to adjust.
                }}
            >
                {/* 
                    If expanded, show search input. 
                    If collapsed, show just the icon (acting as button).
                 */}

                <AnimatePresence mode="popLayout">
                    {isSearchExpanded ? (
                        <motion.div
                            key="search-input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ width: '100%', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                        >
                            <Autocomplete
                                freeSolo
                                options={searchSuggestions}
                                value={searchQuery}
                                inputValue={searchQuery || ''}
                                open={searchQuery.length > 1 && isDropdownOpen}
                                onOpen={() => { if (searchQuery.length > 1) setIsDropdownOpen(true); }}
                                onClose={() => setIsDropdownOpen(false)}
                                filterOptions={(options, { inputValue }) => {
                                    const query = (inputValue || '').toLowerCase().trim();
                                    if (query.length <= 1) return [];
                                    return options.filter(option => (option || '').toLowerCase().includes(query));
                                }}
                                onInputChange={(event, newInputValue, reason) => {
                                    if (reason === 'input' || reason === 'clear') {
                                        setSearchQuery(newInputValue);
                                        setIsDropdownOpen(newInputValue.length > 1);
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    if (typeof newValue === 'string') setSearchQuery(newValue);
                                    setIsDropdownOpen(false);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        inputRef={searchInputRef}
                                        autoFocus
                                        placeholder="Sök adress eller område..."
                                        variant="standard"
                                        InputProps={{
                                            ...params.InputProps,
                                            disableUnderline: true,
                                            sx: {
                                                color: '#fff',
                                                fontSize: '16px',
                                                paddingLeft: '8px'
                                            }
                                        }}
                                        sx={{ flex: 1 }}
                                    />
                                )}
                                sx={{ flex: 1 }}
                            />
                        </motion.div>
                    ) : (
                        <motion.button
                            key="search-btn"
                            className={`search-fab ${activeTab === 'search_focus' ? 'active' : ''}`}
                            onClick={handleSearchClick}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            // Removing CSS transform usage here as we control container manually or via class?
                            // Actually the class .search-fab has transforms. We should probably remove that class 
                            // from this inner button and style it minimally, letting the container handle positioning.
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'transparent',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                margin: 0,
                                boxShadow: 'none', // reset shadow as container has it
                                transform: 'none' // reset transform
                            }}
                        >
                            <SearchIcon sx={{
                                fontSize: '28px',
                                color: isSearchActive ? 'var(--teal-accent)' : 'var(--nav-item-color)',
                                filter: isSearchActive ? 'drop-shadow(0 0 4px rgba(59, 141, 153, 0.5))' : 'none'
                            }} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default TabBar;
