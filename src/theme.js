import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#007aff', // iOS Blue
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#5856d6', // iOS Indigo
        },
        background: {
            default: '#f2f2f7', // iOS Background
            paper: '#ffffff',
        },
        text: {
            primary: '#000000',
            secondary: '#8e8e93',
        },
    },
    typography: {
        fontFamily: '"SF Compact Display", "Inter", system-ui, Avenir, Helvetica, Arial, sans-serif',
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
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                },
                option: {
                    fontSize: '0.9rem',
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
