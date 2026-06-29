import {Outlet} from 'react-router-dom';
import Navbar from '../../pages/user/Navbar.jsx';
import Sidebar from '../../pages/user/Sidebar.jsx';
import ProfileWidget from '../../pages/user/ProfileWidget.jsx';

export default function UserLayout() {
  return (
    <div className="flex h-[100dvh] w-full  overflow-hidden relative">
      
      <Sidebar/>
      {/* MAIN CONTENT AREA (The Map Canvas) */}
      <ProfileWidget/>
      <main className="flex-1 relative z-0 pb-16 md:pb-0"><Outlet /></main>
      {/* navbar */}
      <Navbar/>
      

    </div>
  );
}