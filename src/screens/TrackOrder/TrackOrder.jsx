import React, { useState, useEffect } from 'react';
import './TrackOrder.css';

const TrackOrder = () => {
  const [orderData, setOrderData] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

  const orderStages = [
    {
      id: 1,
      status: 'confirmed',
      title: 'Order Confirmed',
      description: 'Your order has been placed and confirmed',
      icon: '✅'
    },
    {
      id: 2,
      status: 'preparing',
      title: 'Preparing Order',
      description: 'Your order is being prepared',
      icon: '👨‍🍳'
    },
    {
      id: 3,
      status: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Your order is on the way',
      icon: '🚚'
    },
    {
      id: 4,
      status: 'delivered',
      title: 'Delivered',
      description: 'Your order has been delivered',
      icon: '📦'
    }
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchAllOrders(userData.userEmail || userData.id || userData.email);
    }

    const lastOrderId = localStorage.getItem('lastOrderId');
    if (lastOrderId) {
      setOrderId(lastOrderId);
      fetchOrderDetails(lastOrderId);
    }
  }, []);

  const fetchAllOrders = async (userEmail) => {
  setLoadingAllOrders(true);
  try {
    const response = await fetch(`https://foodprep-1w7j.onrender.com/api/orders/user?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }

    const data = await response.json();
    setAllOrders(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    setAllOrders([]);
  } finally {
    setLoadingAllOrders(false);
  }
  };

  const fetchOrderDetails = async (orderIdToFetch) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://foodprep-1w7j.onrender.com/api/orders/track/${orderIdToFetch}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Order not found or server error: ${response.status}`);
      }

      const data = await response.json();
      setOrderData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch order details');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }
    fetchOrderDetails(orderId.trim());
  };

  const handleSelectOrder = (selectedOrderId) => {
    setOrderId(selectedOrderId);
    fetchOrderDetails(selectedOrderId);
    setShowAllOrders(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': '#ffa500',
      'preparing': '#2196f3',
      'out_for_delivery': '#9c27b0',
      'delivered': '#4caf50'
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    };
    return statusTexts[status] || status;
  };

  const getCurrentStageIndex = (status) => {
    const stageMap = {
      'confirmed': 0,
      'preparing': 1,
      'out_for_delivery': 2,
      'delivered': 3
    };
    return stageMap[status] !== undefined ? stageMap[status] : 0;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="track-order-container">
      <div className="track-order-header">
        <h1>Track Your Order</h1>
        <p>Enter your order ID to track your order status</p>
      </div>

      {user && (
        <div className="all-orders-section">
          <div className="orders-header">
            <h3>Your Recent Orders</h3>
            <button 
              className="toggle-orders-btn"
              onClick={() => setShowAllOrders(!showAllOrders)}
            >
              {showAllOrders ? 'Hide Orders' : 'Show All Orders'}
            </button>
          </div>
          
          {showAllOrders && (
            <div className="orders-list">
              {loadingAllOrders ? (
                <div className="loading-orders">
                  <div className="loading-spinner small"></div>
                  <span>Loading orders...</span>
                </div>
              ) : allOrders.length > 0 ? (
                <div className="orders-grid">
                  {allOrders.map((order) => (
                    <div 
                      key={order.orderId} 
                      className={`order-card ${order.orderId === orderId ? 'selected' : ''}`}
                      onClick={() => handleSelectOrder(order.orderId)}
                    >
                      <div className="order-card-header">
                        <span className="order-id">#{order.orderId}</span>
                        <span 
                          className="order-status"
                          style={{ color: getStatusColor(order.status) }}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="order-card-details">
                        <p className="order-date">{formatShortDate(order.orderDate)}</p>
                        <p className="order-total">₹{order.total}</p>
                        <p className="order-items-count">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-orders">
                  <p>No orders found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="order-search">
        <form onSubmit={handleTrackOrder} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Enter Order ID (e.g., ORD1234567890)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="order-input"
            />
            <button type="submit" disabled={loading} className="track-btn">
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Fetching order details...</p>
        </div>
      )}

      {orderData && !loading && (
        <div className="order-details">
          <div className="order-info-card">
            <div className="order-header-info">
              <h2>Order #{orderData.orderId}</h2>
              <div className="order-meta">
                <p><strong>Order Date:</strong> {formatDate(orderData.orderDate)}</p>
                <p><strong>Total Amount:</strong> ₹{orderData.total}</p>
                <p><strong>Payment Method:</strong> {orderData.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className="status-tracker">
            <h3>Order Status</h3>
            <div className="progress-container">
              {orderStages.map((stage, index) => {
                const currentStageIndex = getCurrentStageIndex(orderData.status);
                const isCompleted = index <= currentStageIndex;
                const isActive = index === currentStageIndex;
                
                return (
                  <div key={stage.id} className={`progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="step-icon">
                      <span className="icon">{stage.icon}</span>
                      {isCompleted && <div className="check-mark">✓</div>}
                    </div>
                    <div className="step-content">
                      <h4>{stage.title}</h4>
                      <p>{stage.description}</p>
                      {isActive && (
                        <div className="current-status">
                          <span className="status-badge">Current Status</span>
                        </div>
                      )}
                    </div>
                    {index < orderStages.length - 1 && (
                      <div className={`progress-line ${isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="delivery-info">
            <h3>Delivery Address</h3>
            <div className="address-card">
              <p>{orderData.address.street}</p>
              <p>{orderData.address.city}, {orderData.address.state} {orderData.address.zipCode}</p>
              <p>{orderData.address.country}</p>
            </div>
          </div>

          <div className="order-items">
            <h3>Order Items</h3>
            <div className="items-list">
              {orderData.items.map((item) => (
                <div key={item.id} className="order-item">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-category">{item.category}</p>
                    <div className="item-price-qty">
                      <span>₹{item.price} × {item.quantity}</span>
                      <span className="item-total">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="price-summary">
            <h3>Price Details</h3>
            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal:</span>
                <span>₹{orderData.subtotal}</span>
              </div>
              {orderData.discount > 0 && (
                <div className="price-row discount">
                  <span>Discount:</span>
                  <span>-₹{orderData.discount}</span>
                </div>
              )}
              <div className="price-row total">
                <span>Total:</span>
                <span>₹{orderData.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!orderData && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Enter Order ID to Track</h3>
          <p>You can find your order ID in your confirmation email or receipt</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
