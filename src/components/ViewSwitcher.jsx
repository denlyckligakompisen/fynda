import React from 'react';
import ViewAgendaRoundedIcon from '@mui/icons-material/ViewAgendaRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';

const ViewSwitcher = ({ activeTab, handleTabChange }) => {
    const isMap = activeTab === 'map';

    return (
        <div className="view-switcher" role="tablist" aria-label="Visningsläge">
            <button
                type="button"
                role="tab"
                aria-selected={!isMap}
                aria-label="Bostäder"
                className={`view-switcher-option ${!isMap ? 'active' : ''}`}
                onClick={() => handleTabChange('search')}
            >
                <ViewAgendaRoundedIcon sx={{ fontSize: 20 }} />
                <div className="view-switcher-dot" />
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={isMap}
                aria-label="Karta"
                className={`view-switcher-option ${isMap ? 'active' : ''}`}
                onClick={() => handleTabChange('map')}
            >
                <MapRoundedIcon sx={{ fontSize: 20 }} />
                <div className="view-switcher-dot" />
            </button>
        </div>
    );
};

export default ViewSwitcher;
