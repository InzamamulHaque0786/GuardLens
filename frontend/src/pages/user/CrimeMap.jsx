import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  LuLocateFixed, LuLayers, LuMap, LuSatellite, 
  LuSearch, LuMic, LuClock, LuMapPin, LuX 
} from 'react-icons/lu';

export default function CrimeMap() {

  const [activePin, setActivePin] = useState(null);

  const mapRef = useRef(null);
  const searchContainerRef = useRef(null);
  const defaultPosition = [25.5941, 85.1376]; // Patna, Bihar

  // === MAP TILE & FILTER STATE ===
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [mapType, setMapType] = useState('street'); 
  const tileUrls = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };
  const [filters, setFilters] = useState({ theft: true, vandalism: true, assault: true });

  // === SMART SEARCH STATE ===
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load recent searches from local memory on first boot
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('guardlens_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. CLICK OUTSIDE DETECTOR
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. THE DEBOUNCER (Auto-fetch suggestions as you type)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // We limit it to 5 results to keep the UI clean
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Autocomplete failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait 500ms after the user stops typing before fetching
    const delayTimer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(delayTimer); // Cancels the previous timer if they keep typing
  }, [searchQuery]);

  // 3. EXECUTE THE FLIGHT
  const executeSearch = (lat, lon, displayName) => {
    mapRef.current?.flyTo([lat, lon], 14, { animate: true, duration: 1.5 });
    setSearchQuery(displayName);
    setIsDropdownOpen(false);
    
    // NEW: Drop the pin on the map
    setActivePin({ lat, lon, label: displayName });

    const newRecent = { lat, lon, displayName };
    const updatedRecents = [newRecent, ...recentSearches.filter(item => item.displayName !== displayName)].slice(0, 5);
    setRecentSearches(updatedRecents);
    localStorage.setItem('guardlens_recent_searches', JSON.stringify(updatedRecents));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      // If they hit enter, just fly to the very first suggestion
      executeSearch(suggestions[0].lat, suggestions[0].lon, suggestions[0].display_name);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('guardlens_recent_searches');
  };

 const goToUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
          
          // NEW: Drop the pin for the user's GPS location
          setActivePin({ lat: latitude, lon: longitude, label: "Your Current Location" });
        },
        () => alert("Please enable location permissions.")
      );
    }
  };

  const toggleFilter = (crimeType) => setFilters(prev => ({ ...prev, [crimeType]: !prev[crimeType] }));

  return (
    <div className="h-full w-full relative font-satoshi">
      
      {/* ========================================== */}
      {/* 1. THE SMART SEARCH BAR                    */}
      {/* ========================================== */}
      <div 
        ref={searchContainerRef}
        className="absolute top-4 left-4 right-20 md:right-auto md:w-full md:max-w-sm z-[50]"
      >
        <form 
          onSubmit={handleManualSubmit}
          className="relative flex items-center w-full h-12 px-4 rounded-full bg-(--color-background-1) border border-(--color-border) shadow-md transition-shadow focus-within:ring-2 focus-within:ring-(--color-highlight) z-20"
        >
          <LuSearch size={20} className="text-(--color-muted-foreground) shrink-0" />
          
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search location..." 
            className="w-full h-full bg-transparent border-none outline-none px-3 text-(--color-primary) placeholder:text-(--color-muted-foreground) text-sm font-medium"
          />

          {searchQuery && (
            <button 
              type="button" 
              onClick={() => { setSearchQuery(''); setSuggestions([]); }}
              className="p-1 mr-1 rounded-full text-(--color-muted-foreground) hover:text-(--color-primary) transition-colors shrink-0"
            >
              <LuX size={16} />
            </button>
          )}

          <button type="button" className="p-1 rounded-full text-(--color-muted-foreground) hover:text-(--color-primary) transition-colors shrink-0">
            <LuMic size={18} />
          </button>
        </form>

        {/* ========================================== */}
        {/* THE DROPDOWN MENU                          */}
        {/* ========================================== */}
        {isDropdownOpen && (searchQuery.trim().length > 0 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-(--color-background-1) border border-(--color-border) rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-80">
            <div className="overflow-y-auto">
              
              {/* --- SCENARIO A: SHOWING SUGGESTIONS WHILE TYPING --- */}
              {searchQuery.trim().length > 0 ? (
                <>
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-(--color-muted-foreground)">Searching...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => executeSearch(place.lat, place.lon, place.display_name)}
                        className="w-full flex items-start gap-3 p-3 text-left hover:bg-(--color-background-2) transition-colors border-b border-(--color-border) last:border-0"
                      >
                        <LuMapPin size={18} className="text-(--color-muted-foreground) mt-0.5 shrink-0" />
                        <span className="text-sm text-(--color-primary) line-clamp-2">{place.display_name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-(--color-muted-foreground)">No results found.</div>
                  )}
                </>
              ) : (
                /* --- SCENARIO B: SHOWING RECENT SEARCHES (EMPTY INPUT) --- */
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-(--color-background-2) border-b border-(--color-border)">
                    <span className="text-xs font-bold text-(--color-muted-foreground) uppercase tracking-wider">Recent Searches</span>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-[10px] font-bold text-(--color-danger) hover:opacity-80"
                    >
                      CLEAR
                    </button>
                  </div>
                  {recentSearches.map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeSearch(place.lat, place.lon, place.displayName)}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-(--color-background-2) transition-colors border-b border-(--color-border) last:border-0"
                    >
                      <LuClock size={18} className="text-(--color-muted-foreground) mt-0.5 shrink-0" />
                      <span className="text-sm text-(--color-primary) line-clamp-2">{place.displayName}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. THE MAP ENGINE                            */}
      {/* ========================================== */}
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer url={tileUrls[mapType]} />
         {/* YOUR NEW ACTIVE PIN */}
        {activePin && (
          <Marker position={[activePin.lat, activePin.lon]}>
            <Popup className="font-satoshi font-bold">
              {activePin.label}
            </Popup>
          </Marker>
        )}


        {filters.theft && <Marker position={defaultPosition}><Popup>Sample Theft Report</Popup></Marker>}
      </MapContainer>

      {/* ========================================== */}
      {/* 3. FLOATING MAP CONTROLS                     */}
      {/* ========================================== */}
      <div className="absolute bottom-20 md:bottom-8 right-4 z-[40] flex flex-col gap-3 items-end">
        {isLayerMenuOpen && (
          <div className="bg-(--color-background-1) border border-(--color-border) rounded-2xl shadow-xl p-4 w-48 mb-2 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-(--color-muted-foreground) uppercase tracking-wider mb-2">Map Type</p>
              <div className="flex gap-2">
                <button onClick={() => setMapType('street')} className={`flex-1 flex flex-col items-center p-2 rounded-xl border transition-colors ${mapType === 'street' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700' : 'border-transparent text-(--color-primary) hover:bg-(--color-background-2)'}`}>
                  <LuMap size={20} className="mb-1" /><span className="text-[10px] font-bold">Street</span>
                </button>
                <button onClick={() => setMapType('satellite')} className={`flex-1 flex flex-col items-center p-2 rounded-xl border transition-colors ${mapType === 'satellite' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700' : 'border-transparent text-(--color-primary) hover:bg-(--color-background-2)'}`}>
                  <LuSatellite size={20} className="mb-1" /><span className="text-[10px] font-bold">Satellite</span>
                </button>
              </div>
            </div>
            <div className="border-t border-(--color-border) pt-3">
              <p className="text-xs font-bold text-(--color-muted-foreground) uppercase tracking-wider mb-2">Show Crimes</p>
              {Object.keys(filters).map((crime) => (
                <label key={crime} className="flex items-center gap-3 py-1 cursor-pointer hover:bg-(--color-background-2) px-2 rounded-lg transition-colors">
                  <input type="checkbox" checked={filters[crime]} onChange={() => toggleFilter(crime)} className="w-4 h-4 rounded border-(--color-border) text-(--color-highlight) focus:ring-(--color-highlight)" />
                  <span className="text-sm font-medium text-(--color-primary) capitalize">{crime}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)} className="flex items-center justify-center h-12 w-12 rounded-full bg-(--color-background-1) text-(--color-primary) border border-(--color-border) shadow-md hover:shadow-lg transition-all focus:outline-none"><LuLayers size={22} /></button>
        <button onClick={goToUserLocation} className="flex items-center justify-center h-12 w-12 rounded-full bg-(--color-background-1) text-(--color-highlight) border border-(--color-border) shadow-md hover:shadow-lg transition-all focus:outline-none"><LuLocateFixed size={22} /></button>
      </div>
    </div>
  );
}