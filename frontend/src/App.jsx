import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import Login from './pages/global/Login'
import Home from './pages/user/Home';


const App = () => {
   useEffect(() => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}, []);
  return (
    <Routes>
      <Route path="/user/home" element={<Home/>} />
      <Route path="/login" element={<Login/>} />
      {/* <Route path="/register" element={<Register/>} /> */}
    </Routes>
  )
}

export default App