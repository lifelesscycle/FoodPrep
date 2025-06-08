import React, { useState, useEffect } from 'react';
import './TrackOrder.css';

const TrackOrder = () => {
  const [orderData, setOrderData] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Order status stages
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
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Auto-load last order if available
    const lastOrderId = localStorage.getItem('lastOrderId');
    if (lastOrderId) {
      setOrderId(lastOrderId);
      fetchOrderDetails(lastOrderId);
    }
  }, []);

  // Fetch order details from API
  const fetchOrderDetails = async (orderIdToFetch) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:8000/track_order/${orderIdToFetch}`, {
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

  // Handle order search
  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }
    fetchOrderDetails(orderId.trim());
  };

  // Get current stage index based on order status
  const getCurrentStageIndex = (status) => {
    const stageMap = {
      'confirmed': 0,
      'preparing': 1,
      'out_for_delivery': 2,
      'delivered': 3
    };
    return stageMap[status] !== undefined ? stageMap[status] : 0;
  };

  // Sample method to update order status (for admin/testing purposes)
  const updateOrderStatus = async (newStatus) => {
    if (!orderData) return;
    
    try {
      const response = await fetch(`http://localhost:8000/update_order_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Refresh order data
        fetchOrderDetails(orderData.orderId);
        alert(`Order status updated to: ${newStatus}`);
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
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

  return (
    <div className="track-order-container">
      <div className="track-order-header">
        <h1>Track Your Order</h1>
        <p>Enter your order ID to track your order status</p>
      </div>

      {/* Order ID Input */}
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

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Fetching order details...</p>
        </div>
      )}

      {/* Order Details */}
      {orderData && !loading && (
        <div className="order-details">
          {/* Order Info */}
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

          {/* Order Status Tracker */}
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

          {/* Delivery Address */}
          <div className="delivery-info">
            <h3>Delivery Address</h3>
            <div className="address-card">
              <p>{orderData.address.street}</p>
              <p>{orderData.address.city}, {orderData.address.state} {orderData.address.zipCode}</p>
              <p>{orderData.address.country}</p>
            </div>
          </div>

          {/* Order Items */}
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

          {/* Price Breakdown */}
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