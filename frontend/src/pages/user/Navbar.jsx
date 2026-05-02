import React, { useEffect, useState } from 'react'
import { LuShoppingCart,LuSearch,LuCircleUserRound,LuSun,LuMoon,LuMenu} from "react-icons/lu";

const Navbar = () => {

  // dark and light mood logic
  const [isDark,setIsDark]=useState(false);
  //check on load that the mood is dark or light
  useEffect(()=>{
    const savedTheme = localStorage.getItem("theme")
    if(savedTheme==="dark")
    {
      setIsDark(true);
    }
  },[])
  //now the function to toggle the mood
  const toggleTheme = ()=>{
    document.documentElement.classList.toggle("dark");
    const darkMode = document.documentElement.classList.contains("dark");
    setIsDark(darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }
  //dark and light mood logic ends here

  return (
    <nav className="w-full h-14 md:h-16 flex items-center justify-between md:justify-evenly border-y border-black bg-(--color-foreground)">
    {/* Left Section */}
    <div className="flex items-center  h-full">
      {/* menu toggle button for mobile */}
      <div className='text-2xl md:hidden flex items-center justify-center w-10'>
        <button><LuMenu /></button>
      </div>
      {/* Logo */}
      <div className='h-full flex items-center'>
       <div className="font-integral text-2xl md:text-3xl font-bold h-9 md:h-11 ">GUARDLENS</div>
      </div>
    </div>

  {/* Middle Section */}
   <div className="flex items-center gap-8 ">
      {/* Nav Links */}
      <ul className="hidden md:flex items-center md:gap-2 lg:gap-6 text-sm font-medium">
        <li className="flex items-center gap-1 cursor-pointer">
          Services
          <span>⌄</span>
        </li>
        <li className="cursor-pointer">On Sale</li>
        <li className="cursor-pointer">New Services</li>
        <li className="cursor-pointer">Providers</li>
      </ul>
      {/* search bar */}
      <div className='hidden md:flex bg-(--color-background-3) items-center justify-start  h-10 md:w-50 lg:w-96 rounded-full '>
          <div className='text-gray-500 text-xl h-8 w-12 flex items-center justify-center rounded-full'><LuSearch/></div>
          <div className='text-sm'>
            <input type="text" placeholder='Search for products...' className='outline-none w-full'/>
          </div>
      </div>
    </div>

  {/* Right Section */}
   <div className="flex items-center gap-4 text-2xl md:text-xl w-38">
      <button className="md:hidden shrink-0"><LuSearch /></button>
      <button className='shrink-0'><LuShoppingCart /></button>
      <button className='shrink-0' onClick={toggleTheme}>{isDark?<LuSun />:<LuMoon />}</button>
      <button className='shrink-0'><LuCircleUserRound /></button>
   </div>

</nav>
  )
}

export default Navbar