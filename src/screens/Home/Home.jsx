import React, { useState, useEffect } from "react";
import Header from './../../components/Header'
import Menu from './../../components/Menu'
import Footer from './../../components/Footer'


const Home = ({ cart, setCart, scrollToSection }) => {
  return (
    <div className="home">
      <Header />
      
      <div id="menu-section">
        <Menu 
          cart={cart} 
          setCart={setCart} 
        />
      </div>
            
      <div id="footer-section">
        <Footer />
      </div>
      
    </div>
  );
};

export default Home;