import React from 'react';
import './Cart.css';
import { useNavigate } from 'react-router-dom';

const Cart = ({ cart = [], setCart }) => {
  const navigate = useNavigate();

  const updateQuantity = (itemId, newQuantity) => {
    if (!setCart) return;
    
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => {
        const cartItemId = item.id || item._id || item.name;
        return cartItemId === itemId 
          ? { ...item, quantity: newQuantity }
          : item;
      })
    );
  };

  const removeFromCart = (itemId) => {
    if (!setCart) return;
    
    setCart(prevCart => prevCart.filter(item => {
      const cartItemId = item.id || item._id || item.name;
      return cartItemId !== itemId;
    }));
  };

  const incrementQuantity = (itemId) => {
    const item = cart.find(cartItem => {
      const cartItemId = cartItem.id || cartItem._id || cartItem.name;
      return cartItemId === itemId;
    });
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };

  const decrementQuantity = (itemId) => {
    const item = cart.find(cartItem => {
      const cartItemId = cartItem.id || cartItem._id || cartItem.name;
      return cartItemId === itemId;
    });
    if (item) {
      updateQuantity(itemId, item.quantity - 1);
    }
  };

  const clearCart = () => {
    if (!setCart) return;
    setCart([]);
  };

  const calculateItemTotal = (item) => {
    return item.price * item.quantity;
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const confirmed = window.confirm(
    `Proceed to checkout with ${getTotalItems()} items totaling Rs ${calculateCartTotal()}?`
  );
  
  if (confirmed) {
    navigate('/order');
  }
};


  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h2>Your Shopping Cart</h2>
        </div>
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <button className="continue-shopping-btn" onClick={() => window.history.back()}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Your Shopping Cart</h2>
        <div className="cart-summary">
          <span className="item-count">{getTotalItems()} items</span>
          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cart.map((item) => {
            const itemId = item.id || item._id || item.name;
            
            return (
              <div key={itemId} className="cart-item">
                <div className="item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-description">{item.description}</p>
                  <p className="item-category">Category: {item.category}</p>
                </div>
                
                <div className="item-price">
                  <span className="unit-price">Rs {item.price}</span>
                </div>
                
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn decrease"
                    onClick={() => decrementQuantity(itemId)}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    className="quantity-input"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(itemId, parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <button 
                    className="quantity-btn increase"
                    onClick={() => incrementQuantity(itemId)}
                  >
                    +
                  </button>
                </div>
                
                <div className="item-total">
                  <span className="total-price">Rs {calculateItemTotal(item)}</span>
                </div>
                
                <button 
                  className="remove-item-btn"
                  onClick={() => removeFromCart(itemId)}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="cart-sidebar">
          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="summary-row">
              <span>Items ({getTotalItems()})</span>
              <span>Rs {calculateCartTotal()}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>Rs 50</span>
            </div>
            
            <div className="summary-row">
              <span>Tax (5%)</span>
              <span>Rs {Math.round(calculateCartTotal() * 0.05)}</span>
            </div>
            
            <hr className="summary-divider" />
            
            <div className="summary-row total-row">
              <span>Total</span>
              <span>Rs {calculateCartTotal() + 50 + Math.round(calculateCartTotal() * 0.05)}</span>
            </div>
            
            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
            
            <button className="continue-shopping-btn" onClick={() => window.history.back()}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;