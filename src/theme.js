import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light', // Keep light as base but use CSS vars
        primary: {
            main: '#0a84ff', // iOS Blue
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#5e5ce6', // iOS Indigo
        },
        background: {
            default: 'var(--bg-primary)',
            paper: 'var(--bg-card)',
        },
        text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
        },
    },
    typography: {
        fontFamily: '"SF Compact Display", "Inter", system-ui, Avenir, Helvetica, Arial, sans-serif',
        allVariants: {
            color: 'var(--text-primary)'
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove elevation overlay
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                }
            }
        },
        MuiAutocomplete: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                },
                option: {
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    '&[aria-selected="true"]': {
                        backgroundColor: 'var(--bg-secondary)',
                    },
                    '&.Mui-focused': {
                        backgroundColor: 'var(--bg-secondary)',
                    }
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 8,
                    padding: '8px 12px',
                }
            }
        }
    },
});

export default theme;
