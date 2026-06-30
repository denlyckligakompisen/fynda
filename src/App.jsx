import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMediaQuery } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import HouseIcon from '@mui/icons-material/House';
import ApartmentIcon from '@mui/icons-material/Apartment';


// Components
import GlobalHeader from './components/GlobalHeader';
import ScrollToTop from './components/ScrollToTop';
import IosInstallPrompt from './components/IosInstallPrompt';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';

// Context & Hooks
import { FilterProvider } from './context/FilterContext';
import { useAuth } from './context/AuthContext';
import { addFavorite, removeFavorite, syncFavorites } from './services/favoritesService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Utils
import PullToRefresh from './components/PullToRefresh';
import { formatLastUpdated } from './utils/formatters';

// Reset user settings on page reload
if (typeof window !== 'undefined') {
    localStorage.removeItem('userInterestRate');
    localStorage.removeItem('userLoanPercentage');
}

function App() {
    // Merge main data (now just the fetched live data, or fallback local data)
    const [allData, setAllData] = useState([]);
    const [meta, setMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState('intro');
    const [isScrolled, setIsScrolled] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('fynda_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTab, setActiveTab] = useState('search'); // 'search', 'map', 'info'
    const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'synced', null
    const [hoveredListingUrl, setHoveredListingUrl] = useState(null);
    const [analyzedIds, setAnalyzedIds] = useState([]);
    
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const isLandscape = useMediaQuery('(orientation: landscape)');

    // Track page views on tab changes
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", page: `/${activeTab}`, title: activeTab.toUpperCase() });
    }, [activeTab]);

    // Auth
    const { user, loading: authLoading, signInWithGoogle, signInWithApple, signOut } = useAuth();

    // Save favorites to localStorage (always, as backup)
    useEffect(() => {
        localStorage.setItem('fynda_favorites', JSON.stringify(favorites));
    }, [favorites]);

    // Sync favorites with Firebase when user logs in
    useEffect(() => {
        if (user && !authLoading) {
            setSyncStatus('syncing');
            const localFavorites = JSON.parse(localStorage.getItem('fynda_favorites') || '[]');
            syncFavorites(user.uid, localFavorites)
                .then(merged => {
                    setFavorites(merged);
                    setSyncStatus('synced');
                })
                .catch(() => setSyncStatus(null));
        }
    }, [user, authLoading]);

    // Fetch analyzed IDs for authorized user
    useEffect(() => {
        if (user && user.email === 'frebrandberg@gmail.com') {
            const unsubscribe = onSnapshot(collection(db, 'analyses'), (snapshot) => {
                const ids = snapshot.docs.map(doc => decodeURIComponent(doc.id));
                setAnalyzedIds(ids);
            }, (error) => {
                console.error("Error listening to analyses:", error);
            });
            return () => unsubscribe();
        } else {
            setAnalyzedIds([]);
        }
    }, [user]);

    const toggleFavorite = useCallback(async (url) => {
        const isAdding = !favorites.includes(url);

        // Optimistic update
        setFavorites(prev =>
            isAdding
                ? [...prev, url]
                : prev.filter(u => u !== url)
        );

        // Sync to cloud if logged in
        if (user) {
            try {
                if (isAdding) {
                    await addFavorite(user.uid, url);
                } else {
                    await removeFavorite(user.uid, url);
                }
            } catch (error) {
                // Revert on error
                setFavorites(prev =>
                    isAdding
                        ? prev.filter(u => u !== url)
                        : [...prev, url]
                );
            }
        }
    }, [favorites, user]);

    const fetchData = useCallback(async () => {
        try {
            console.log('Fetching listing data...');
            const dataUrl = import.meta.env.DEV 
                ? `/listing_data.json?t=${Date.now()}` 
                : `https://raw.githubusercontent.com/denlyckligakompisen/fynda/main/public/listing_data.json?t=${Date.now()}`;

            const response = await fetch(dataUrl, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }

            const liveData = await response.json();

            if (liveData.objects && Array.isArray(liveData.objects) && liveData.objects.length > 0) {
                // Data Validation
                const validObjects = liveData.objects.filter(obj =>
                    obj && typeof obj === 'object' && obj.url && obj.address
                );

                setAllData(validObjects);
                setMeta(liveData.meta || null);
            } else {
                console.warn('Listing data is incomplete or empty');
            }
        } catch (error) {
            console.error('Failed to fetch listing data:', error.message);
        }
    }, []);

    // Initial data load and scroll listener
    useEffect(() => {
        const loadData = async () => {
            await fetchData();
            setIsLoading(false);
        };

        loadData();

        const introTimer = setTimeout(() => {
            setViewState('app');
        }, 2000);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(introTimer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Animation lock
    useEffect(() => {
        if (!isLoading && !hasAnimated) {
            const timer = setTimeout(() => {
                setHasAnimated(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, hasAnimated]);

    const shouldAnimate = !hasAnimated;

    const handleTabChange = useCallback((tabId) => {
        if (tabId === 'search' || tabId === 'search_focus') {
            if (activeTab === 'search' || activeTab === 'search_focus') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Fallback for some mobile browsers
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            } else {
                setActiveTab(tabId);
                window.scrollTo(0, 0);
            }
        } else {
            setActiveTab(tabId);
        }
    }, [activeTab]);
    
    const handleMarkerClick = useCallback((url) => {
        const cardId = `listing-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Ensure the item is rendered by the infinite scroll list
        window.dispatchEvent(new CustomEvent('ensure-visible', { detail: { url } }));
        
        if (!isDesktop && activeTab === 'map') {
            handleTabChange('search');
        }

        // Highlight the marker when clicked
        setHoveredListingUrl(url);

        setTimeout(() => {
            const element = document.getElementById(cardId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-pulse');
                setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
            }
        }, 300);
    }, [isDesktop, activeTab, handleTabChange]);


    // Extract unique search suggestions
    const searchSuggestions = useMemo(() => {
        const suggestions = new Set();
        allData.forEach(item => {

            if (item.address) suggestions.add(item.address);
            if (item.area) suggestions.add(item.area);
        });
        return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'sv'));
    }, [allData]);


    const renderContent = () => {
        if (isDesktop || isLandscape) {
            return (
                <DesktopLayout
                    fetchData={fetchData}
                    hoveredListingUrl={hoveredListingUrl}
                    setHoveredListingUrl={setHoveredListingUrl}
                    handleMarkerClick={handleMarkerClick}
                    shouldAnimate={shouldAnimate}
                />
            );
        }

        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <MobileLayout
                    activeTab={activeTab}
                    fetchData={fetchData}
                    hoveredListingUrl={hoveredListingUrl}
                    setHoveredListingUrl={setHoveredListingUrl}
                    handleMarkerClick={handleMarkerClick}
                    shouldAnimate={shouldAnimate}
                />
            </div>
        );
    };

    return (
        <FilterProvider data={allData} favorites={favorites} toggleFavorite={toggleFavorite} isLoading={isLoading} analyzedIds={analyzedIds}>
            <div className={`app-container tab-${activeTab} ${isScrolled ? 'is-scrolled' : ''}`}>
                <GlobalHeader 
                    activeTab={activeTab} 
                    handleTabChange={handleTabChange}
                    user={user}
                    signInWithGoogle={signInWithGoogle}
                    signOut={signOut}
                    meta={meta}
                />
                <main className="main-content">
                    {renderContent()}
                </main>
                <IosInstallPrompt />
                <ScrollToTop />
            </div>
        </FilterProvider>
    );
}

export default App;
