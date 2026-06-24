import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LuMap, 
  LuTriangleAlert, 
  LuShieldAlert, 
  LuRadio, 
  LuBrainCircuit, 
  LuLayoutDashboard,
  LuClipboardList,
  LuSettings
} from "react-icons/lu";

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LuLayoutDashboard size={24} /> },
    { path: '/admin/crime-map', label: 'Crime Map', icon: <LuMap size={24} /> },
    { path: '/admin/crime-report', label: 'Crime Reports', icon: <LuClipboardList size={24} /> },
    { path: '/admin/broadcast-message', label: 'Broadcast', icon: <LuRadio size={24} /> },
  ];

  return (
    <nav className="md:hidden absolute bottom-0 w-full bg-(--color-background-1) border-t border-(--color-border) shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 pb-[env(safe-area-inset-bottom)] px-1 font-satoshi transition-colors duration-300">
      <div className="flex justify-around items-center h-16">
        
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all
                ${active ? 'text-(--color-highlight)' : 'text-(--color-muted-foreground) hover:text-(--color-primary)'}`}
            >
              {/* Icon Container with a tiny bounce effect when active */}
              <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              
              {/* Tiny text label */}
              <span className={`text-[10px] tracking-wide transition-all ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}

export default Navbar;