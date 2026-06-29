import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LuSettings, LuMoon, LuX, LuUser, LuLogOut } from "react-icons/lu";
import api from "../../api/API"

export default function ProfileWidget() {
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
      {/* 1. THE CIRCULAR AVATAR BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-12 w-12 rounded-full border-2 border-(--gl-border-focus) bg-(--gl-bg-base) shadow-md overflow-hidden  transition-all focus:outline-none"
      >
        {user?.profileImage ? (
          <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-(--gl-brand-primary) bg-(--gl-bg-surface) h-full w-full flex items-center justify-center font-satoshi">
            {initial}
          </span>
        )}
      </button>
      
      {/* 2. THE MENU (Full Screen Mobile / Popover Desktop) */}
      {isOpen && (
        <div className={`
          fixed inset-0 flex flex-col bg-(--gl-bg-base) z-[100] transition-all font-satoshi
          md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-72 md:rounded-2xl md:shadow-2xl md:border md:border-(--gl-border-light) md:z-50
        `}>
          
          {/* Mobile-Only Header with Close Button */}
          <div className="flex md:hidden justify-between items-center p-5 border-b border-(--gl-border-light)">
            <h2 className="font-integral font-bold text-xl text-(--gl-text-main)">Menu</h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 bg-(--gl-bg-surface) rounded-full text-(--gl-text-main) active:scale-95 transition-transform"
            >
              <LuX size={20} />
            </button>
          </div>

          {/* User Info Header */}
          <div className=" p-6 md:p-5 border-b border-(--gl-border-light) bg-(--gl-bg-surface) md:rounded-t-3xl flex flex-col items-center text-center gap-4">
            <div className="h-22 w-22 md:h-20 md:w-20 rounded-full bg-(--gl-bg-base) border-2 border-(--gl-border-focus) flex items-center justify-center overflow-hidden shrink-0">
               {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-(--gl-brand-primary)">{initial}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-lg md:text-base text-(--gl-text-main) truncate">{user?.name}</p>
              <p className="text-sm text-(--gl-text-muted) truncate">{user?.email}</p>
            </div>
          </div>
          
          {/* Menu Links */}
          <div className="p-4 flex flex-col gap-2 flex-1 md:flex-none">
            <Link
              to={user?.role === 'admin' ? '/admin/dashboard' : '/user/profile'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover) rounded-xl transition-colors"
            >
              <LuUser size={20} className="text-(--gl-text-muted)" />
              View Profile
            </Link>

            <Link
              to="/user/settings"
              onClick={() => setIsOpen(false)}
              className="flex md:hidden items-center gap-3 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover) rounded-xl transition-colors"
            >
              <LuSettings size={20} className="text-(--gl-text-muted)" />
              Settings
            </Link>
            
            <button
              onClick={toggleDarkMode}
              className="flex md:hidden items-center w-full text-left gap-3 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover) rounded-xl transition-colors"
            >
              <LuMoon size={20} className="text-(--gl-text-muted)" />
              Toggle Theme
            </button>
          </div>

          {/* Logout Section */}
          <div className="p-4 border-t border-(--gl-border-light) mt-auto md:mt-0">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-4 md:py-3 text-base md:text-sm font-bold text-(--gl-text-muted) hover:text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover) border-1 rounded-xl transition-colors"
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