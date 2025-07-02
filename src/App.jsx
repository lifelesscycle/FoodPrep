import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Login from "./screens/Login/Login";
import PlaceOrder from './screens/PlaceOrder/PlaceOrder';
import Cart from './screens/Cart/Cart';
import Home from './screens/Home/Home';
import TrackOrder from "./screens/TrackOrder/TrackOrder";
import ProtectedRoute from './components/ProtectedRoute';
import OwnerDashboard from "./screens/Dashborad/Dashborad";
import ManagerDashboard from "./screens/ManagerDashboard/ManagerDashboard";
import AddItems from "./screens/AddItems/AddItems";
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [cart, setCart] = useState([]);


  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const openLogin = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  return (
    <Router>
      <Navbar 
        cart={cart}
        scrollToSection={scrollToSection}
        user={user} 
        onLogin={openLogin} 
        onLogout={handleLogout} 
      />
      <Routes>
        <Route path="/" element={<Home 
                cart={cart} 
                setCart={setCart}
                scrollToSection={scrollToSection}
              />} />
        <Route path="/cart" element={<Cart
                cart={cart} 
                setCart={setCart}
                scrollToSection={scrollToSection} />} />
        <Route path="/order" element={<PlaceOrder 
                cart={cart}
                setCart={setCart}
                scrollToSection={scrollToSection} 
                />} />
        <Route path="/track-order" element={<TrackOrder/>}/>
        <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard/>
              </ProtectedRoute>
            } 
        />
        <Route 
            path="/add-items" 
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <AddItems/>
              </ProtectedRoute>
            } 
        />
        <Route 
            path="/ManagerDashboard" 
            element={
              <ProtectedRoute allowedRoles={['owner','manager']}>
                <ManagerDashboard/>
              </ProtectedRoute>
            } 
        />
      </Routes>
      
      <Login 
        isOpen={showLogin}
        onClose={closeLogin}
        onLogin={handleLogin}
      />
    </Router>
  );
};

export default App;