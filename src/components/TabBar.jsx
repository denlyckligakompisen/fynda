import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

/**
 * Bottom navigation bar for mobile
 */
const TabBar = ({ activeTab, handleTabChange }) => {
    const tabs = [
        { id: 'search', label: 'Sök', icon: <SearchRoundedIcon className="tab-icon" /> },
        { id: 'map', label: 'Karta', icon: <MapRoundedIcon className="tab-icon" /> },
        { id: 'saved', label: 'Sparade', icon: <FavoriteRoundedIcon className="tab-icon" /> },
        { id: 'info', label: 'Info', icon: <InfoRoundedIcon className="tab-icon" /> }
    ];

    return (
        <nav className="tab-bar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                >
                    {tab.icon}
                </button>
            ))}
        </nav>
    );
};

export default TabBar;
