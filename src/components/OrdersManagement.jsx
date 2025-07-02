import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  XCircle,
  Eye,
  Edit,
  MapPin
} from 'lucide-react';

const API_BASE_URL = 'https://foodprepbackend-crj8.onrender.com';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('confirmed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmed', color: '#f59e0b', icon: <Clock /> },
    { value: 'preparing', label: 'Preparing', color: '#ef4444', icon: <AlertCircle /> },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: '#3b82f6', icon: <Truck /> },
    { value: 'delivered', label: 'Delivered', color: '#10b981', icon: <CheckCircle /> },
    { value: 'cancelled', label: 'Cancelled', color: '#6b7280', icon: <XCircle /> }
  ];

  useEffect(() => {
    fetchOrdersByStatus(selectedStatus);
  }, [selectedStatus]);

  const fetchOrdersByStatus = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/by_status?status=${status}`,{method:'GET'});
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/update_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: newStatus, lastUpdated: new Date().toISOString() }
              : order
          )
        );
        
        if (newStatus !== selectedStatus) {
          setTimeout(() => fetchOrdersByStatus(selectedStatus), 1000);
        }
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(searchLower) ||
      order.userName.toLowerCase().includes(searchLower) ||
      order.userEmail.toLowerCase().includes(searchLower) ||
      order.items?.some(item => item.name.toLowerCase().includes(searchLower))
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="order-modal-overlay" onClick={onClose}>
        <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="order-modal-header">
            <h3>Order Details - #{order.orderId}</h3>
            <button onClick={onClose} className="modal-close-button">
              <XCircle />
            </button>
          </div>
          
          <div className="order-modal-body">
            <div className="order-info-section">
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> {order.userName}</p>
              <p><strong>Email:</strong> {order.userEmail}</p>
              <p><strong>Order Date:</strong> {formatDate(order.orderDate)}</p>
              <p><strong>Status:</strong> 
                <span className={`order-status status-${order.status}`}>
                  {getStatusInfo(order.status).label}
                </span>
              </p>
            </div>

            <div className="order-info-section">
              <h4>Delivery Address</h4>
              <div className="address-info">
                <MapPin className="address-icon" />
                <div>
                  <p>{order.address?.street}</p>
                  <p>{order.address?.city}, {order.address?.state} {order.address?.zipCode}</p>
                  <p>{order.address?.country}</p>
                </div>
              </div>
            </div>

            <div className="order-info-section">
              <h4>Order Items</h4>
              <div className="modal-order-items">
                {order.items?.map((item, index) => (
                  <div key={index} className="modal-order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-category">{item.category}</span>
                    </div>
                    <div className="item-details">
                      <span className="item-quantity">Qty: {item.quantity}</span>
                      <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-info-section">
              <h4>Order Summary</h4>
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
                {order.appliedCoupon && (
                  <div className="summary-row">
                    <span>Coupon:</span>
                    <span>{order.appliedCoupon}</span>
                  </div>
                )}
                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="order-info-section">
                <h4>Status History</h4>
                <div className="status-history">
                  {order.statusHistory.map((status, index) => (
                    <div key={index} className="status-history-item">
                      <div className="status-timestamp">
                        {formatDate(status.timestamp)}
                      </div>
                      <div className="status-info">
                        <span className={`status-badge status-${status.status}`}>
                          {getStatusInfo(status.status).label}
                        </span>
                        <p>{status.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="orders-management">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-management">
        <div className="orders-error">
          <AlertCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={() => fetchOrdersByStatus(selectedStatus)} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-management">
      <div className="orders-header">
        <h2 className="orders-title">Orders Management</h2>
        <div className="orders-controls">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            className="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <span className="stat-number">{filteredOrders.length}</span>
          <span className="stat-label">{getStatusInfo(selectedStatus).label} Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
          </span>
          <span className="stat-label">Total Value</span>
        </div>
      </div>

      <div className="orders-grid">
        {filteredOrders.map((order) => (
          <div key={order.orderId} className={`order-card order-${order.status}`}>
            <div className="order-header">
              <h3 className="order-id">#{order.orderId}</h3>
              <span className={`order-status status-${order.status}`}>
                {getStatusInfo(order.status).icon}
                {getStatusInfo(order.status).label}
              </span>
            </div>
            
            <div className="order-details">
              <p className="customer-info">
                <strong>{order.userName}</strong>
              </p>
              <p className="customer-email">{order.userEmail}</p>
              <p className="order-total">{formatCurrency(order.total)}</p>
              <p className="order-date">
                {formatDate(order.orderDate)}
              </p>
            </div>

            <div className="order-items-preview">
              <h4>Items ({order.items?.length || 0}):</h4>
              {order.items?.slice(0, 2).map((item, index) => (
                <div key={index} className="order-item-preview">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              {order.items?.length > 2 && (
                <p className="more-items">+{order.items.length - 2} more items</p>
              )}
            </div>

            <div className="order-actions">
              <button 
                className="view-details-button"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
              >
                <Eye />
                View Details
              </button>
              <select 
                className="status-update-select"
                value={order.status}
                onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="no-orders">
          {searchTerm ? (
            <p>No orders found matching "{searchTerm}"</p>
          ) : (
            <p>No orders found with status: {getStatusInfo(selectedStatus).label}</p>
          )}
        </div>
      )}

      {showOrderDetails && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrdersManagement;