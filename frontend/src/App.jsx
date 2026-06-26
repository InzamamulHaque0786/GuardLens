import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- GUARDS ---
import PublicGuard from './components/guards/PublicGuard';
import AdminGuard from './components/guards/AdminGuard';
import UserGuard from './components/guards/UserGuard';

// --- LAYOUTS ---
import AdminLayout from './components/layouts/AdminLayout';
import UserLayout from './components/layouts/UserLayout';

// --- PUBLIC PAGES ---
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// --- ADMIN PAGES ---
import Dashboard from './pages/admin/Dashboard';
import AdminCrimeMap from './pages/admin/CrimeMap';
import CrimeReports from './pages/admin/CrimeReports';
import BroadcastMessage from './pages/admin/BroadcastMessage';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile'
import DetailedReport from './pages/admin/DetailedReport'

// --- USER PAGES ---
import CrimeMap from './pages/user/CrimeMap';
import ReportCrime from './pages/user/ReportCrime';
import MyReports from './pages/user/MyReports';
import MyReportDetails from './pages/user/MyReportDetails';
import GeoFence from './pages/user/GeoFence';
import Broadcast from './pages/user/Broadcast';
import AIassist from './pages/user/AIassist';
import Settings from './pages/user/Settings';
import UserProfile from './pages/user/UserProfile';
import ReviewReport from './pages/user/ReviewReport';


const RootRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/user/crime-map" replace />;
};


const App = () => {
   useEffect(() => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}, []);
  return (
    <Routes>
       {/* root url */}
      <Route path="/" element={<RootRedirect/>} />
       {/* Public routes */}
      <Route path="/login" element={<PublicGuard><Login /></PublicGuard>}/>
      <Route path="/register" element={<PublicGuard><Register /></PublicGuard>} />

       {/* the admin routes */}
      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        {/* These render exactly where the <Outlet /> is inside AdminLayout */}
        <Route path="dashboard" element={<Dashboard/>} />
        <Route path="crime-map" element={<AdminCrimeMap/>} />
        <Route path="crime-report" element={<CrimeReports/>} />
        <Route path="broadcast-message" element={<BroadcastMessage/>} />
        <Route path="settings" element={<AdminSettings/>} />
        <Route path="profile" element={<AdminProfile/>} />
        <Route path="report/:id" element={<DetailedReport/>} />
        
        
      </Route>

       {/* the user routes */}
      <Route path="/user" element={<UserGuard><UserLayout /></UserGuard>}>
        {/* These render exactly where the <Outlet /> is inside UserLayout */}
        <Route path="crime-map" element={<CrimeMap/>} />
        <Route path="report-crime" element={<ReportCrime/>} />
        <Route path="reports" element={<MyReports/>} />
        <Route path="report/:id" element={<MyReportDetails/>} />
        <Route path="geo-fence" element={<GeoFence/>} />
        <Route path="broadcast" element={<Broadcast/>} />
        <Route path="ai-assistant" element={<AIassist/>} />
        <Route path="review-report" element={<ReviewReport/>} />
        <Route path="settings" element={<Settings/>} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* page not found route(catch all) */}
      <Route path="*" element={
        <div className="flex h-screen items-center justify-center flex-col bg-gray-50">
          <h1 className="text-4xl font-bold text-gray-800">404</h1>
          <p className="text-gray-500 mt-2">Page Not Found</p>
        </div>
      } />
    </Routes>
  )
}

export default App