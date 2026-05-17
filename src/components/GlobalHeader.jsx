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
    searchSuggestions = [],
    user,
    signInWithGoogle,
    signOut
}) => {
    const navItems = [
        { id: 'search', label: 'Lista', icon: <ListAltIcon /> },
        { id: 'map', label: 'Karta', icon: <MapIcon /> },
        { id: 'info', label: 'Info', icon: <InfoIcon /> }
    ];

    return (
        <>
            {/* Desktop Header */}
            <header className="global-header desktop-only">
                <div className="header-content">
                    <div className="header-left" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
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

                    <div className="header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                    src={user.photoURL}
                                    alt=""
                                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                    decoding="async"
                                />
                                <button
                                    onClick={signOut}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Logga ut
                                </button>
                            </div>
                        ) : signInWithGoogle ? (
                            <button
                                onClick={signInWithGoogle}
                                style={{
                                    background: '#fff',
                                    color: '#3c4043',
                                    border: '1px solid #dadce0',
                                    borderRadius: '20px',
                                    padding: '6px 14px 6px 10px',
                                    fontSize: '0.8rem',
                                    fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 1px 2px rgba(60,64,67,0.3)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844v.001c-.208 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" fillRule="evenodd" />
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd" />
                                    <path d="M3.964 10.706a5.41 5.41 0 0 1-.282-1.706c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" fillRule="evenodd" />
                                    <path d="M9 3.58c1.321 0 2.508.455 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332c.708-2.131 2.692-3.715 5.036-3.715z" fill="#EA4335" fillRule="evenodd" />
                                </svg>
                                Logga in
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            {/* Mobile Header */}
            <header className="global-header mobile-only">
                <div className="header-content" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
                    <div className="mobile-auth" style={{ display: 'flex', alignItems: 'center' }}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                    src={user.photoURL}
                                    alt=""
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
                                    onClick={() => {
                                        if (window.confirm("Vill du logga ut?")) {
                                            signOut();
                                        }
                                    }}
                                />
                            </div>
                        ) : signInWithGoogle ? (
                            <button
                                onClick={signInWithGoogle}
                                style={{
                                    background: '#fff',
                                    color: '#3c4043',
                                    border: '1px solid #dadce0',
                                    borderRadius: '20px',
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 1px 2px rgba(60,64,67,0.3)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844v.001c-.208 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" fillRule="evenodd" />
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd" />
                                    <path d="M3.964 10.706a5.41 5.41 0 0 1-.282-1.706c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" fillRule="evenodd" />
                                    <path d="M9 3.58c1.321 0 2.508.455 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332c.708-2.131 2.692-3.715 5.036-3.715z" fill="#EA4335" fillRule="evenodd" />
                                </svg>
                                Logga in
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>
        </>
    );
};

export default GlobalHeader;
