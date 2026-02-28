import { Box } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';

const SortingControl = ({ iconFilters, toggleIconFilter }) => {
    const options = [
        { value: 'newest', label: 'NYAST' },
        { value: 'dealScore', label: 'DIFF' },
        { value: 'monthlyCost', label: 'MÅNADSKOSTNAD' },
        { value: 'viewingSort', label: 'VISNING' }
    ];

    const currentValue =
        iconFilters.dealScore ? 'dealScore' :
            iconFilters.monthlyCost ? 'monthlyCost' :
                iconFilters.viewingSort ? 'viewingSort' :
                    'newest';

    return (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <SortRoundedIcon
                sx={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '16px',
                    color: 'var(--text-secondary)',
                    zIndex: 2,
                    pointerEvents: 'none',
                    opacity: 0.7
                }}
            />
            <select
                className="app-filter-button"
                value={currentValue}
                onChange={(e) => toggleIconFilter(e.target.value)}
                style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    padding: '0 32px 0 34px',
                    width: 'auto',
                    minWidth: '160px',
                    cursor: 'pointer',
                    background: 'var(--filter-bg)',
                    position: 'relative',
                    textAlign: 'left',
                    height: '32px'
                }}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <KeyboardArrowDownRoundedIcon
                sx={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: 'var(--text-secondary)',
                    zIndex: 2,
                    pointerEvents: 'none',
                    opacity: 0.5
                }}
            />
        </Box>
    );
};

export default SortingControl;
