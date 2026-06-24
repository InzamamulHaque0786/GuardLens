import {Outlet} from 'react-router-dom';
import Sidebar from '../../pages/admin/Sidebar.jsx';
import Navbar from '../../pages/admin/Navbar.jsx';
import AdminProfile from '../../pages/admin/AdminProfile.jsx'


export default function AdminLayout() {
 

  return (
    <div className="flex h-[100dvh] w-full bg-(--color-background-1) overflow-hidden relative">
      
      {/* DESKTOP SIDEBAR */}
     
      <Sidebar/>
      {/* MAIN CONTENT AREA */}
      <AdminProfile/>
      <main className="flex-1 relative z-0 pb-16 md:pb-0 ">
        <Outlet />
      </main>
      <Navbar/>
     

    </div>
  );
}