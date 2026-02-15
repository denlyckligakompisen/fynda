import { FormControl, Select, MenuItem } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';

const SortingControl = ({ iconFilters, toggleIconFilter }) => {
    return (
        <FormControl size="small" variant="standard" sx={{ minWidth: 140 }}>
            <Select
                value={
                    iconFilters.dealScore ? 'dealScore' :
                        iconFilters.monthlyCost ? 'monthlyCost' :
                            iconFilters.viewingSort ? 'viewingSort' :
                                'newest'
                }
                onChange={(e) => {
                    const val = e.target.value;
                    const currentVal = iconFilters.dealScore ? 'dealScore' :
                        iconFilters.monthlyCost ? 'monthlyCost' :
                            iconFilters.viewingSort ? 'viewingSort' :
                                'newest';
                    if (val !== currentVal) {
                        toggleIconFilter(val);
                    }
                }}
                displayEmpty
                disableUnderline
                IconComponent={() => null}
                sx={{
                    color: 'text.primary',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '& .MuiSelect-select': {
                        padding: '6px 12px !important',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }
                }}
                renderValue={(selected) => {
                    const labels = {
                        newest: 'NYAST',
                        dealScore: 'FYNDA',
                        monthlyCost: 'MÅNADSKOSTNAD',
                        viewingSort: 'VISNING'
                    };
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}>
                            <SortRoundedIcon sx={{ fontSize: '1.1rem', opacity: 0.7 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>{labels[selected] || selected.toUpperCase()}</span>
                        </div>
                    );
                }}
            >
                <MenuItem value="dealScore" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>FYNDA</MenuItem>
                <MenuItem value="monthlyCost" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>MÅNADSKOSTNAD</MenuItem>
                <MenuItem value="newest" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>NYAST</MenuItem>
                <MenuItem value="viewingSort" sx={{ fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.5px' }}>VISNING</MenuItem>
            </Select>
        </FormControl>
    );
};

export default SortingControl;
