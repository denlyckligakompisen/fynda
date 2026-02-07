/**
 * Bottom navigation bar for mobile
 */
const TabBar = ({ activeTab, handleTabChange }) => {
    const tabs = [
        { id: 'search', label: 'Sök', icon: 'search' },
        { id: 'map', label: 'Karta', icon: 'map' },
        { id: 'saved', label: 'Sparade', icon: 'favorite' },
        { id: 'info', label: 'Info', icon: 'info' }
    ];

    return (
        <nav className="tab-bar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                >
                    <span className="material-symbols-outlined tab-icon">{tab.icon}</span>
                </button>
            ))}
        </nav>
    );
};

export default TabBar;
