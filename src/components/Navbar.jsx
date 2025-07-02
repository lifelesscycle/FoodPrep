import { useState , useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { Link } from "react-router-dom";
import { assets } from './../assets/assets/assets';

const Navbar = ({ scrollToSection, user, onLogin, onLogout, cart = [] }) => {
  const [menu, setMenu] = useState('home');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (menuItem) => {
    setMenu(menuItem);
    
    if (menuItem === 'menu' || menuItem === 'contact-us') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const sectionId = menuItem === 'menu' ? 'menu-section' : 'footer-section';
          scrollToSection(sectionId);
        }, 100);
      } else {
        const sectionId = menuItem === 'menu' ? 'menu-section' : 'footer-section';
        scrollToSection(sectionId);
      }
    }
  };

  const handleUserMenuClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  const handleOutsideClick = (e) => {
    if (!e.target.closest('.user-menu')) {
      setShowDropdown(false);
    }
  };

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [showDropdown]);

  return (
    <div className='navbar'>
      <Link to="/" onClick={() => handleMenuClick("home")}>
        <img className="logo" src={assets.logo} alt=" " />
      </Link>
      <ul className='nav'>
        <li onClick={() => handleMenuClick("home")} className={menu === "home" ? "active" : ""}>
          <Link to="/">Home</Link>
        </li>
        <li onClick={() => handleMenuClick("menu")} className={menu === "menu" ? "active" : ""}>
          <span style={{ cursor: 'pointer' }}>Menu</span>
        </li>
        <li onClick={() => handleMenuClick("track-order")} className={menu === "track-order" ? "active" : ""}>
          <Link to="/track-order">Track Order</Link>
        </li>
        <li onClick={() => handleMenuClick("contact-us")} className={menu === "contact-us" ? "active" : ""}>
          <span style={{ cursor: 'pointer' }}>Contact Us</span>
        </li>
      </ul>
      <div className="navbar-right">
        <Link to="/cart" className="navbar-basket-icon">
          <img className='basket' src={assets.basket_icon} alt="Cart" />
          {getTotalCartItems() > 0 && (
            <div className="navbar-dot">
              <span className="cart-count">{getTotalCartItems()}</span>
            </div>
          )}
        </Link>
        
        <div className="auth-section">
          {user ? (
            <div className="user-menu" onClick={handleUserMenuClick}>
              <img 
                className="user-icon" 
                src={assets.profile_icon} 
                alt="User" 
              />
              {showDropdown && (
                <div className="dropdown">
                  <div className="user-info">
                    <span>{user.name || user.email}</span>
                  </div>
                  <button onClick={handleLogout} className="logout-btn">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="navbar-signin-button" onClick={onLogin}>
              Sign In/Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;