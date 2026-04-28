import React from 'react';
import { motion } from 'framer-motion';
import { Autocomplete, TextField } from '@mui/material';
import {
    ListAltRounded as ListAltIcon,
    MapRounded as MapIcon,
    FavoriteRounded as FavoriteIcon,
    InfoRounded as InfoIcon,
    SearchRounded as SearchIcon
} from '@mui/icons-material';

const GlobalHeader = ({ 
    activeTab, 
    handleTabChange,
    searchQuery,
    setSearchQuery,
    searchSuggestions = []
}) => {
    const navItems = [
        { id: 'search', label: 'Lista', icon: <ListAltIcon /> },
        { id: 'map', label: 'Karta', icon: <MapIcon /> },
        { id: 'saved', label: 'Favoriter', icon: <FavoriteIcon /> },
        { id: 'info', label: 'Info', icon: <InfoIcon /> }
    ];

    return (
        <header className="global-header desktop-only">
            <div className="header-content">
                <div className="header-left" style={{ flex: 1 }}>
                    {/* Placeholder to balance flex layout */}
                </div>
                
                <nav className="header-nav" style={{ flexShrink: 0 }}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-btn ${activeTab === item.id || (item.id === 'search' && activeTab === 'search_focus') ? 'active' : ''}`}
                            onClick={() => handleTabChange(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            { (activeTab === item.id || (item.id === 'search' && activeTab === 'search_focus')) && (
                                <motion.div 
                                    layoutId="activeTabUnderline"
                                    className="nav-underline"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="header-search-container">
                        <SearchIcon className="search-icon-fixed" />
                        <Autocomplete
                            freeSolo
                            disableClearable
                            options={searchSuggestions}
                            value={searchQuery}
                            onInputChange={(e, val) => setSearchQuery(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Sök adress eller område..."
                                    variant="standard"
                                    InputProps={{ ...params.InputProps, disableUnderline: true }}
                                    sx={{
                                        ml: 1,
                                        width: '280px',
                                        '& .MuiInputBase-input': {
                                            fontSize: '0.9rem',
                                            color: 'var(--text-primary)'
                                        }
                                    }}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default GlobalHeader;
