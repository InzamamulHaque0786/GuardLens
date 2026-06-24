import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LuSettings, LuMoon, LuX, LuUser, LuLogOut } from "react-icons/lu";
import api from "../../api/API"

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = async () => {
   try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout request to backend failed:", error);
      setUser(null);
      navigate('/login');
    }
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="absolute top-4 right-4 z-[60]" ref={dropdownRef}>
      {/* 1. THE CIRCULAR AVATAR BUTTON              */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-12 w-12 rounded-full border border-(--color-border) bg-(--color-background-1) shadow-md overflow-hidden hover:opacity-80 transition-all focus:outline-none"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-(--color-highlight) bg-(--color-background-2) h-full w-full flex items-center justify-center font-satoshi">
            {initial}
          </span>
        )}
      </button>
      {/* 2. THE MENU (Full Screen Mobile / Popover Desktop) */}
      {isOpen && (
        <div className={`
          fixed inset-0 flex flex-col bg-(--color-background-1) z-[100] transition-all font-satoshi
          md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-72 md:rounded-3xl md:shadow-2xl md:border md:border-(--color-border) md:z-50
        `}>
          
          {/* Mobile-Only Header with Close Button */}
          <div className="flex md:hidden justify-between items-center p-5 border-b border-(--color-border)">
            <h2 className="font-integral font-bold text-xl text-(--color-primary)">Menu</h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 bg-(--color-background-2) rounded-full text-(--color-primary) active:scale-95 transition-transform"
            >
              <LuX size={20} />
            </button>
          </div>

          {/* User Info Header */}
          <div className="p-6 md:p-5 border-b border-(--color-border) bg-(--color-background-2) md:rounded-t-3xl flex items-center gap-4">
            <div className="h-14 w-14 md:h-12 md:w-12 rounded-full bg-(--color-background-1) border border-(--color-border) flex items-center justify-center overflow-hidden shrink-0">
               {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-(--color-highlight)">{initial}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-lg md:text-base text-(--color-primary) truncate">{user?.name}</p>
              <p className="text-sm text-(--color-muted-foreground) truncate">{user?.email}</p>
            </div>
          </div>
          
          {/* Menu Links */}
          <div className="p-4 flex flex-col gap-2 flex-1 md:flex-none">
            <Link
              to={user?.role === 'admin' ? '/admin/profile' : '/user/profile'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-(--color-primary) hover:bg-(--color-background-2) rounded-xl transition-colors"
            >
              <LuUser size={20} className="text-(--color-muted-foreground)" />
              View Profile
            </Link>

            <Link
              to="/user/settings"
              onClick={() => setIsOpen(false)}
              className="flex md:hidden items-center gap-3 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-(--color-primary) hover:bg-(--color-background-2) rounded-xl transition-colors"
            >
              <LuSettings size={20} className="text-(--color-muted-foreground)" />
              Settings
            </Link>
            
            <button
              onClick={toggleDarkMode}
              className="flex md:hidden items-center w-full text-left gap-3 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-(--color-primary) hover:bg-(--color-background-2) rounded-xl transition-colors"
            >
              <LuMoon size={20} className="text-(--color-muted-foreground)" />
              Toggle Theme
            </button>
          </div>

          {/* Logout Section */}
          <div className="p-4 border-t border-(--color-border) mt-auto md:mt-0">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-4 md:py-3 text-base md:text-sm font-bold text-(--color-danger) bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors"
            >
              <LuLogOut size={20} />
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}