import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LuChevronLeft, 
  LuChevronRight, 
  LuMap, 
  LuTriangleAlert, 
  LuShieldAlert, 
  LuRadio, 
  LuBrainCircuit, 
  LuSettings,
  LuMoon,
  LuClipboardList
} from "react-icons/lu";
import { RiChatAiLine } from "react-icons/ri";

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('guardlens_theme');
    
    // If saved dark mode previously, apply it immediately
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const navigationItems = [
    { path: '/user/crime-map', label: 'Crime Map', icon: <LuMap size={22} /> },
    { path: '/user/report-crime', label: 'Report Crime', icon: <LuTriangleAlert size={22} /> },
    { path: '/user/reports', label: 'My Reports', icon: <LuClipboardList size={22} /> },
    { path: '/user/broadcast', label: 'Alerts', icon: <LuRadio size={22} /> },
    { path: '/user/ai-assistant', label: 'AI Assistant', icon: <RiChatAiLine size={22} /> },
    { path: '/user/settings', label: 'Settings', icon: <LuSettings size={22} /> },
  ];

  const toggleDarkMode = () => {
    const root = document.documentElement;
    
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('guardlens_theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('guardlens_theme', 'dark');
    }
  };

  return (
    <aside 
      className={`hidden md:flex flex-col h-full border-r transition-all duration-300 ease-in-out z-10 font-satoshi
        bg-(--gl-bg-base) border-(--gl-border-light) shadow-sm relative 
        ${isOpen ? 'w-64' : 'w-18'}`}
    >
    
      <div className="p-4 flex items-center justify-between border-b border-(--gl-border-light) h-20 min-h-16">
        {isOpen ? (
          <>
            <h1 className="font-integral text-xl font-bold tracking-tight text-(--gl-text-main)">
              GUARDLENS
            </h1>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl border border-(--gl-border-light) bg-(--gl-bg-surface) text-(--gl-text-main) hover:opacity-80 transition-all cursor-pointer"
            >
              <LuChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="p-1.5 mx-auto rounded-xl border border-(--gl-border-light) bg-(--gl-bg-surface) text-(--gl-text-main) hover:opacity-80 transition-all cursor-pointer"
          >
            <LuChevronRight size={18} />
          </button>
        )}
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 p-3 space-y-2 ">
        {navigationItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-2xl p-3 font-medium transition-all group relative
                ${active 
                  ? 'bg-(--gl-bg-surface) text-(--gl-brand-primary)' 
                  : 'text-(--gl-text-muted) hover:bg-(--gl-bg-surface-hover) hover:text-(--gl-text-main)'}`}
            >
              {/* Icon Container */}
              <div className={`flex items-center justify-center transition-colors ${active ? 'text-(--gl-brand-primary)' : ''}`}>
                {item.icon}
              </div>

              {/* Text Label / Popover Logic */}
              {isOpen ? (
                <span className="ml-3 text-sm tracking-wide whitespace-nowrap transition-opacity duration-200">
                  {item.label}
                </span>
              ) : (
                /* Tooltip Popup when Sidebar is closed */
                <div className="absolute left-full ml-4 px-3 py-2 bg-(--gl-text-main) text-(--gl-bg-base) text-xs font-semibold rounded-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 shadow-md whitespace-nowrap z-60">
                  {item.label}
                  {/* Small pointer arrow for tooltip */}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-(--gl-text-main)" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* SIDEBAR FOOTER */}
      <div className="p-3 border-t border-(--gl-border-light) flex flex-col items-center gap-2">
        {/* Dark mode button */}
        <button 
          onClick={toggleDarkMode}
          className={`w-full flex items-center p-3 text-sm font-medium rounded-2xl text-(--gl-sos-base) hover:bg-(--gl-bg-surface-hover) transition-all cursor-pointer group relative ${!isOpen ? 'justify-center' : ''}`}
        >
          <div className="text-(--gl-text-muted) group-hover:text-(--gl-text-main) transition-colors">
            <LuMoon size={22} />
          </div>
          {isOpen ? (
            <span className="ml-3 text-(--gl-text-muted) group-hover:text-(--gl-text-main)">Theme Mode</span>
          ) : (
            <div className="absolute left-full ml-4 px-3 py-2 bg-(--gl-text-main) text-(--gl-bg-base) text-xs font-semibold rounded-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 shadow-md whitespace-nowrap z-50">
              Toggle Theme
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-(--gl-text-main)" />
            </div>
          )}
        </button>

        {/* Closed Mini Logo indicator */}
        {!isOpen && (
          <div className="mt-2 text-[16px] font-integral font-black tracking-tighter text-(--gl-text-muted) select-none">
            GL
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;