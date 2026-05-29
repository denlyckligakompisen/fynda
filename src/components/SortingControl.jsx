import { useState } from 'react';
import { Box, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

const SortingControl = ({ iconFilters, toggleIconFilter }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const options = [
        { value: 'dealScore', label: 'Bästa Dealen (Diff)' },
        { value: 'monthlyCost', label: 'Lägst månadskostnad' },
        { value: 'lowestPrice', label: 'Lägst pris' },
        { value: 'newest', label: 'Nyaste först' }
    ];

    const currentValue =
        iconFilters.dealScore ? 'dealScore' :
            iconFilters.monthlyCost ? 'monthlyCost' :
                iconFilters.lowestPrice ? 'lowestPrice' :
                    'newest';
    
    // Kortare etikett för knappen
    const buttonLabels = {
        'dealScore': 'Diff',
        'monthlyCost': 'Kostnad',
        'lowestPrice': 'Pris',
        'newest': 'Nyast'
    };
    
    const currentLabel = buttonLabels[currentValue] || 'Sortera';

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (value) => {
        toggleIconFilter(value);
        handleClose();
    };

    return (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <button
                className="app-filter-button"
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 8px 0 12px',
                }}
            >
                <SortRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2px' }}>
                    {currentLabel}
                </span>
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: 'var(--text-secondary)', ml: '2px' }} />
            </button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: '16px', // iOS rounding
                        mt: 1,
                        minWidth: 220,
                        boxShadow: 'var(--shadow-card)',
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid var(--border-color)'
                    }
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {options.map((opt) => (
                    <MenuItem 
                        key={opt.value} 
                        onClick={() => handleSelect(opt.value)}
                        sx={{ py: 1.5, px: 2 }}
                    >
                        <ListItemText 
                            primary={opt.label} 
                            primaryTypographyProps={{ 
                                fontSize: '0.9rem', 
                                fontWeight: currentValue === opt.value ? 600 : 500,
                                color: currentValue === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }} 
                        />
                        {currentValue === opt.value && (
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>
                                <CheckRoundedIcon sx={{ fontSize: 20, color: '#007aff' }} />
                            </ListItemIcon>
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default SortingControl;
