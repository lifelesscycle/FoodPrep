import { menu_list } from '../assets/assets/assets'
import leftArrowSvg from '../assets/assets/left-arrow.svg'
import rightArrowSvg from '../assets/assets/right-arrow.svg'
import './Menu.css'
import React, { useState, useEffect } from 'react'

const Menu = ({ cart = [], setCart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All'); 
  const [foodItems, setFoodItems] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const itemsToShow = 5; 

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://foodprep-1w7j.onrender.com/api/food/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.items) {
          setFoodItems(data.items);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching food items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === menu_list.length - itemsToShow 
        ? 0 
        : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 
        ? menu_list.length - itemsToShow 
        : prevIndex - 1
    );
  };

  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % menu_list.length;
      items.push(menu_list[index]);
    }
    return items;
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const getFilteredFoodItems = () => {
    if (selectedCategory === 'All') {
      return foodItems; 
    }
    
    return foodItems.filter(item => {
      return item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  };

  const addToCart = (foodItem) => {
    if (!setCart) {
      console.warn('setCart function not provided');
      return;
    }

    const itemId = foodItem.id || foodItem._id || foodItem.name;
    
    console.log('Adding to cart:', itemId, foodItem); 

    setCart(prevCart => {
      const existingItem = prevCart.find(item => {
        const cartItemId = item.id || item._id || item.name;
        return cartItemId === itemId;
      });
      
      if (existingItem) {
        return prevCart.map(item => {
          const cartItemId = item.id || item._id || item.name;
          return cartItemId === itemId 
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      } else {
        return [...prevCart, { 
          ...foodItem, 
          id: itemId, 
          quantity: 1 
        }];
      }
    });
  };

  const removeFromCart = (foodItemId) => {
    if (!setCart) {
      console.warn('setCart function not provided');
      return;
    }

    console.log('Removing from cart:', foodItemId); 

    setCart(prevCart => {
      return prevCart.reduce((acc, item) => {
        const cartItemId = item.id || item._id || item.name;
        
        if (cartItemId === foodItemId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, []);
    });
  };

  const getItemQuantityInCart = (foodItemId) => {
    const cartItem = cart.find(item => {
      const cartItemId = item.id || item._id || item.name;
      return cartItemId === foodItemId;
    });
    return cartItem ? cartItem.quantity : 0;
  };

  if (loading) {
    return (
      <div className='Explore-Menu' id='Explore-Menu'>
        <h2>Explore Our Menu</h2>
        <p>Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='Explore-Menu' id='Explore-Menu'>
        <h2>Explore Our Menu</h2>
        <p>Error loading menu items: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className='Explore-Menu' id='Explore-Menu'>
      <h2>Explore Our Menu</h2>
      <p>Choose from a diverse menu featuring a detectable array of dishes. Our mission is to satisfy your craving and elevate your dining experience one delicious meal at a time.</p>
      
      <div className="category-filter">
        <button 
          className={`category-btn ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => handleCategoryClick('All')}
        >
          All
        </button>
      </div>

      <div className="menu-carousel-container">
        <button className="carousel-arrow left-arrow" onClick={prevSlide}>
          <img src={leftArrowSvg} alt="Previous" />
          <svg viewBox="0 0 24 24">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        
        <div className="Explore-menu-list">
          {getVisibleItems().map((item, index) => (
            <div 
              key={`${currentIndex}-${index}`} 
              className={`explore-menu-list-item ${selectedCategory === item.menu_name ? 'selected' : ''}`}
              onClick={() => handleCategoryClick(item.menu_name)}
              style={{ cursor: 'pointer' }}
            >
              <img src={item.menu_image} alt={item.menu_name}/>
              <p>{item.menu_name}</p>
            </div>
          ))}
        </div>
        
        <button className="carousel-arrow right-arrow" onClick={nextSlide}>
          <img src={rightArrowSvg} alt="Next" />
          <svg viewBox="0 0 24 24">
            <polyline points="9,6 15,12 9,18"></polyline>
          </svg>
        </button>
      </div>
      
      <div className="carousel-dots">
        {Array.from({ length: menu_list.length }, (_, index) => (
          <button 
            key={index} 
            className={`dot ${index >= currentIndex && index < currentIndex + itemsToShow ? 'active' : ''}`} 
            onClick={() => setCurrentIndex(index)} 
          />
        ))}
      </div>

      <div className='Menu'>
        <h3>
          {selectedCategory === 'All' ? 'All Items' : selectedCategory} 
          ({getFilteredFoodItems().length} items)
        </h3>
        <div className="display-food">
          {getFilteredFoodItems().map((item, index) => {
            // Create a unique identifier for each item
            const itemId = item.id || item._id || `item-${index}`;
            const quantityInCart = getItemQuantityInCart(itemId);
            
            return (
              <div key={itemId} className="food-item">
                <img src={item.image} alt={item.name} className="food-image" />
                <div className="food-info">
                  <h3 className="food-name">{item.name}</h3>
                  <p className="food-price">Rs {item.price}</p>
                  <p className="food-description">{item.description}</p>
                  
                  <div className="cart-controls">
                    {quantityInCart === 0 ? (
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => addToCart({...item, id: itemId})}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn decrease"
                          onClick={() => removeFromCart(itemId)}
                        >
                          -
                        </button>
                        <span className="quantity-display">{quantityInCart}</span>
                        <button 
                          className="quantity-btn increase"
                          onClick={() => addToCart({...item, id: itemId})}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default Menu
