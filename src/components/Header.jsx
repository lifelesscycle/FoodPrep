import React from 'react'
import'./Header.css'

const Header = () => {
  return (
    <div className="header">
        <div className="Header-Content">
            <h1>Order Your Favorite Food Here </h1>
            <h2>Choose from diverse menu featuring a detectable array of dishes crafted with the finest ingredients and culinary expertise. Our mission is to satisfy your cravings and elevate your dining experience, one delicious meal at a time.</h2>
            <button className='View-More'>View More</button>
        </div>
    </div>
  )
}

export default Header