import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/API.js'; 

export default function AdminLayout() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white border-r shadow-sm z-10">
        <div className="p-4 text-xl font-bold border-b border-gray-800">
          Admin Portal
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/admin/dashboard" 
            className={`block p-3 rounded-lg font-medium transition-colors ${isActive('/admin/dashboard') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/admin/manage-users" 
            className={`block p-3 rounded-lg font-medium transition-colors ${isActive('/admin/manage-users') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            👥 Manage Users
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full text-left p-3 text-red-400 font-medium hover:bg-gray-800 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative z-0 pb-16 md:pb-0 bg-gray-100">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden absolute bottom-0 w-full bg-gray-900 border-t border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-around items-center z-10 pb-[env(safe-area-inset-bottom)]">
        <Link 
          to="/admin/dashboard" 
          className={`flex flex-col items-center p-3 flex-1 ${isActive('/admin/dashboard') ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <span className="text-xl">📊</span>
          <span className="text-xs font-medium mt-1">Stats</span>
        </Link>
        <Link 
          to="/admin/manage-users" 
          className={`flex flex-col items-center p-3 flex-1 ${isActive('/admin/manage-users') ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <span className="text-xl">👥</span>
          <span className="text-xs font-medium mt-1">Users</span>
        </Link>
        <button 
          onClick={handleLogout} 
          className="flex flex-col items-center p-3 flex-1 text-red-400"
        >
          <span className="text-xl">🚪</span>
          <span className="text-xs font-medium mt-1">Logout</span>
        </button>
      </nav>

    </div>
  );
}