import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useFilterContext } from '../context/FilterContext';
import { SearchRounded as SearchIcon, HomeRounded as HomeIcon } from '@mui/icons-material';
import SearchHeader from './SearchHeader';
import { formatLastUpdated } from '../utils/formatters';

const GlobalHeader = ({ 
    activeTab, 
    handleTabChange,
    user,
    signInWithGoogle,
    signOut,
    meta
}) => {
    const { searchQuery, setSearchQuery, searchSuggestions = [] } = useFilterContext();

    return (
        <div className="global-header-wrapper" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
            {/* Desktop Header */}
            <header className="global-header desktop-only" aria-label="Huvudnavigation" style={{ position: 'relative' }}>
                <div className="header-content" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', width: '100%' }}>
                    <div className="header-left" style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
                        <a href="/" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '8px', marginLeft: '-8px', borderRadius: '50%', background: 'transparent', transition: 'background 0.2s' }} className="header-home-btn" title="Gå till startsidan">
                            <HomeIcon />
                        </a>
                    </div>
                    <nav className="header-center" aria-label="Sök och navigering" style={{ justifySelf: 'center' }}>
                        <div className="header-search-container">
                            <SearchIcon className="search-icon-fixed" />
                            <Autocomplete
                                freeSolo
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
                    </nav>
                    
                    <div className="header-right" style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {meta?.generatedAt && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                Uppdaterades: {formatLastUpdated(meta.generatedAt)}
                            </div>
                        )}
                        {user ? (
                            <div className="header-user-group">
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "Användarprofil"}
                                    className="header-avatar"
                                    decoding="async"
                                />
                                <button
                                    onClick={signOut}
                                    className="header-signout-btn"
                                >
                                    Logga ut
                                </button>
                            </div>
                        ) : signInWithGoogle ? (
                            <button
                                onClick={signInWithGoogle}
                                className="header-signin-btn"
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
            <header className="global-header mobile-only" aria-label="Mobilhuvud" style={{ position: 'relative' }}>
                <div className="header-content header-content--mobile" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '8px', alignItems: 'center' }}>
                    <a href="/" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '4px', marginLeft: '4px' }} title="Gå till startsidan">
                        <HomeIcon sx={{ fontSize: '24px' }} />
                    </a>
                    <div className="header-search-container" style={{ flex: 1, padding: '4px 12px' }}>
                        <SearchIcon className="search-icon-fixed" style={{ fontSize: '18px' }} />
                        <Autocomplete
                            freeSolo
                            options={searchSuggestions}
                            value={searchQuery}
                            onInputChange={(e, val) => setSearchQuery(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Sök adress..."
                                    variant="standard"
                                    InputProps={{ ...params.InputProps, disableUnderline: true }}
                                    sx={{
                                        ml: 1,
                                        width: '100%',
                                        '& .MuiInputBase-input': {
                                            fontSize: '0.9rem',
                                            color: 'var(--text-primary)'
                                        }
                                    }}
                                />
                            )}
                            sx={{ flex: 1 }}
                        />
                    </div>
                    <div className="mobile-auth" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {meta?.generatedAt && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                {formatLastUpdated(meta.generatedAt)}
                            </div>
                        )}
                        {user ? (
                            <div className="header-user-group">
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName ? `Logga ut ${user.displayName}` : "Logga ut"}
                                    className="header-avatar header-avatar--mobile"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            if (window.confirm("Vill du logga ut?")) {
                                                signOut();
                                            }
                                        }
                                    }}
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
                                className="header-signin-btn header-signin-btn--mobile"
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

            {/* Filter/Search Bar (Shared) */}
            <div className="global-filter-container" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderBottom: '0.5px solid var(--border-color)' }}>
                <SearchHeader />
            </div>
        </div>
    );
};

export default GlobalHeader;
