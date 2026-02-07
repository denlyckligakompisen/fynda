/**
 * Bottom navigation bar for mobile
 */
const TabBar = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'search', label: 'Sök', icon: 'search' },
        { id: 'saved', label: 'Sparade', icon: 'favorite' },
        { id: 'map', label: 'Karta', icon: 'map' },
        { id: 'info', label: 'Info', icon: 'info' }
    ];

    return (
        <nav className="tab-bar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    <span className="material-symbols-outlined tab-icon">{tab.icon}</span>
                </button>
            ))}
        </nav>
    );
};

export default TabBar;
