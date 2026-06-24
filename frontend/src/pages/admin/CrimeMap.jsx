import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup ,Tooltip} from 'react-leaflet';
import L from 'leaflet';
import { 
  LuLocateFixed, LuLayers, LuMap, LuSatellite, 
  LuSearch, LuMic, LuClock, LuMapPin, LuX,LuShieldAlert, LuImage, LuVideo, LuInfo
} from 'react-icons/lu';
import API from '../../api/API'

const createCustomIcon = (status) => {
  const colorClass = status === 'verified' ? 'bg-green-500' : 'bg-yellow-500';
  const shadowClass = status === 'verified' ? 'shadow-green-500/50' : 'shadow-yellow-500/50';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white ${colorClass} shadow-lg ${shadowClass} flex items-center justify-center animate-pulse"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    tooltipAnchor: [12, 0]
  });
};

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
  const [filters, setFilters] = useState({});
  const [crimes, setCrimes] = useState([]);
  const [isLoadingCrimes, setIsLoadingCrimes] = useState(true);

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

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await API.get('/crime/crime-locations');
        const fetchedCrimes = response.data.data;
        setCrimes(fetchedCrimes);
        
        // Dynamically build your layer menu filters based on the database data!
        const uniqueTypes = [...new Set(fetchedCrimes.map(c => c.crimeType.toLowerCase()))];
        const newFilters = {};
        uniqueTypes.forEach(type => newFilters[type] = true);
        setFilters(newFilters);
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setIsLoadingCrimes(false);
      }
    };
    fetchMapData();
  }, []);

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


       {isLoadingCrimes && (
        <div className="absolute inset-0 z-[2000] bg-(--color-background-1)/50 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-2xl font-bold text-(--color-highlight) animate-pulse flex items-center gap-3">
            <LuMapPin className="animate-bounce" /> Syncing Live Data...
          </div>
        </div>
      )}
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


       {/* DATABASE CRIME PINS */}
        {crimes.map((crime) => {
          // Check if this crime type is toggled ON in your layer menu filters
          const isVisible = filters[crime.crimeType.toLowerCase()] !== false;
          if (!isVisible) return null;

          return (
            <Marker 
              key={crime._id}
              position={[crime.crimeLocation.latitude, crime.crimeLocation.longitude]}
              icon={createCustomIcon(crime.status)}
            >
              <Tooltip className="custom-tooltip font-satoshi border-0 shadow-lg rounded-lg" direction="top" offset={[0, -10]}>
                <div className="text-center">
                  <p className="font-bold text-gray-900 uppercase text-sm">{crime.crimeType}</p>
                  <p className="text-xs text-gray-500">{crime.status === 'verified' ? 'Verified' : 'Pending'}</p>
                </div>
              </Tooltip>

              <Popup className="custom-popup" maxWidth={320} minWidth={280}>
                <div className="flex flex-col gap-3 font-satoshi text-gray-800 p-1">
                  <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                    <div>
                      <h3 className="font-bold text-lg leading-tight uppercase">{crime.crimeType}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider text-white ${crime.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {crime.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    <p className="text-sm leading-snug">{crime.crimeDescription || "No description provided."}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <LuClock size={12} /> {new Date(crime.crimeTime).toLocaleString()}
                    </div>
                  </div>

                  {(crime.images?.length > 0 || crime.videoUrl) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <LuInfo size={12}/> Evidence Attached
                      </p>
                      {crime.images?.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {crime.images.map((img, i) => (
                            <img key={i} src={img} alt="evidence" className="w-12 h-12 rounded object-cover border border-gray-200 flex-shrink-0" />
                          ))}
                        </div>
                      )}
                      {crime.videoUrl && (
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded">
                          <LuVideo size={14} /> Video available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
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
      {/* Inject Leaflet popup/tooltip custom overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .leaflet-popup-content { margin: 12px; }
        .leaflet-tooltip { padding: 8px 12px; background: white; border-radius: 8px; }
      `}} />
    </div>
  );
}