import React, { useState, useEffect } from 'react';
import './PlaceOrder.css';
import Login from './../Login/Login';

const PlaceOrder = ({ cart, setCart }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const availableCoupons = {
    'SAVE10': { discount: 10, type: 'percentage' },
    'FLAT50': { discount: 50, type: 'flat' },
    'WELCOME20': { discount: 20, type: 'percentage' }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const applyCoupon = () => {
    const coupon = availableCoupons[couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon(coupon);
      alert(`Coupon applied! You saved ${coupon.type === 'percentage' ? coupon.discount + '%' : '₹' + coupon.discount}`);
    } else {
      alert('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const saveOrderToFastAPI = async (orderData) => {
    try {
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      
      const response = await fetch('https://foodprep-1w7j.onrender.com/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to place order`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('Please login to place order');
      return;
    }

    if (!address.street || !address.city || !address.state || !address.zipCode) {
      alert('Please fill in all address fields');
      return;
    }

    setIsProcessing(true);

    const orderData = {
      orderId: `ORD${Date.now()}`,
      userId: String(user.userid || user.id),
      userName: String(user.name),
      userEmail: String(user.email),
      items: cart.map(item => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
        category: item.category ? String(item.category) : null,
        image: item.image ? String(item.image) : null
      })),
      address: {
        street: String(address.street).trim(),
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        zipCode: String(address.zipCode).trim(),
        country: String(address.country || 'India').trim()
      },
      subtotal: Number(calculateSubtotal().toFixed(2)),
      discount: Number(calculateDiscount().toFixed(2)),
      total: Number(calculateTotal().toFixed(2)),
      appliedCoupon: appliedCoupon ? String(couponCode).trim() : null,
      paymentMethod: String(paymentMethod),
      orderDate: new Date().toISOString(),
      status: "confirmed"
    };

    console.log('Order data before sending:', orderData);

    try {
      const result = await saveOrderToFastAPI(orderData);
      if (result.success) {
        setOrderPlaced(true);
        setCart([]);
        localStorage.removeItem('cart');
        
        localStorage.setItem('lastOrderId', result.orderId);
      }
    } catch (error) {
      if (error.message.includes('User not found')) {
        alert('User not found. Please register first or check your login details.');
      } else {
        alert(`Failed to place order: ${error.message}`);
      }
    }

    setIsProcessing(false);
  };

  if (orderPlaced) {
    return (
      <div className="checkout-container">
        <div className="order-success">
          <div className="success-icon">✅</div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your order. You will receive a confirmation email shortly.</p>
          <button onClick={() => window.location.href = '/'} className="continue-shopping">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart to proceed with checkout</p>
          <button onClick={() => window.location.href = '/'} className="continue-shopping">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
      </div>

      {!isLoggedIn && (
        <div className="login-prompt">
          <div className="login-message">
            <h3>Please login to continue</h3>
            <button onClick={() => setShowLogin(true)} className="login-btn">
              Login / Register
            </button>
          </div>
        </div>
      )}

      <Login 
        isOpen={showLogin}
        onClose={closeLogin}
        onLogin={handleLogin}
      />

      {isLoggedIn && (
        <div className="checkout-content">
          <div className="checkout-left">
            <div className="checkout-section">
              <h3>Delivery Address</h3>
              <div className="address-form">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={address.street}
                  onChange={(e) => setAddress({...address, street: e.target.value})}
                />
                <div className="address-row">
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => setAddress({...address, state: e.target.value})}
                  />
                </div>
                <div className="address-row">
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={address.zipCode}
                    onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => setAddress({...address, country: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="checkout-section">
              <h3>Payment Method</h3>
              <div className="payment-methods">
                <label className="payment-option">
                  <input
                    type="radio"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Credit/Debit Card
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  UPI
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Cash on Delivery
                </label>
              </div>

              {paymentMethod === 'card' && (
                <div className="card-details">
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardDetails.cardholderName}
                    onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                  />
                  <div className="card-row">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiryDate}
                      onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="checkout-right">
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} className="item-image" />
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-category">{item.category}</p>
                      <p className="item-price">₹{item.price}</p>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}>
                        -
                      </button>
                      <span>{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="coupon-section">
                <h4>Apply Coupon</h4>
                <div className="coupon-input">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <button onClick={applyCoupon} className="apply-coupon">
                      Apply
                    </button>
                  ) : (
                    <button onClick={removeCoupon} className="remove-coupon">
                      Remove
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="coupon-applied">
                    Coupon "{couponCode}" applied! 
                    Discount: {appliedCoupon.type === 'percentage' ? 
                      `${appliedCoupon.discount}%` : `₹${appliedCoupon.discount}`}
                  </p>
                )}
                <div className="available-coupons">
                  <small>Available coupons: SAVE10, FLAT50, WELCOME20</small>
                </div>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal()}</span>
                </div>
                {appliedCoupon && (
                  <div className="price-row discount">
                    <span>Discount:</span>
                    <span>-₹{calculateDiscount()}</span>
                  </div>
                )}
                <div className="price-row total">
                  <span>Total:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                className="place-order-btn"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Place Order - ₹${calculateTotal()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
