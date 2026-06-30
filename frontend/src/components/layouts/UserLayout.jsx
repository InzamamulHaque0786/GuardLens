// import {Outlet} from 'react-router-dom';
// import Navbar from '../../pages/user/Navbar.jsx';
// import Sidebar from '../../pages/user/Sidebar.jsx';
// import ProfileWidget from '../../pages/user/ProfileWidget.jsx';

// export default function UserLayout() {
//   return (
//     <div className="flex h-[100dvh]  w-full flex-row overflow-hidden relative">
      
//       <Sidebar/>
//       {/* MAIN CONTENT AREA (The Map Canvas) */}
//       <ProfileWidget/>
//       <main className="flex-1 relative z-0 pb-16 md:pb-0"><Outlet /></main>
//       {/* navbar */}
//       <Navbar/>
      

//     </div>
//   );
// }


import {Outlet} from 'react-router-dom';
import Navbar from '../../pages/user/Navbar.jsx';
import Sidebar from '../../pages/user/Sidebar.jsx';
import ProfileWidget from '../../pages/user/ProfileWidget.jsx';

export default function UserLayout() {
  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden bg-(--gl-bg-base) text-(--gl-text-main)">
      <Sidebar/>
      <ProfileWidget/>
      <main className="flex-1 overflow-y-auto relative"><Outlet /></main>
      <Navbar className="h-[16dvh] shrink-0 border-t border-(--gl-border-light) bg-(--gl-bg-surface)"/>
    </div>
  );
}

