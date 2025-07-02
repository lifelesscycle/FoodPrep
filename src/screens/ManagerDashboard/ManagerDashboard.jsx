import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Package, Truck, CheckCircle, XCircle, Eye, Filter, Search } from 'lucide-react';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const API_BASE = 'https://foodprepbackend-crj8.onrender.com'; 

  const orderStatuses = [
    { value: 'confirmed', label: 'Confirmed', icon: Clock, color: '#3B82F6' },
    { value: 'preparing', label: 'Preparing', icon: Package, color: '#F59E0B' },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: '#8B5CF6' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: '#10B981' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: '#EF4444' }
  ];

  const statusFilters = [
    { value: 'all', label: 'All Orders' },
    ...orderStatuses
  ];

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const allOrders = [];
      
      for (const status of orderStatuses) {
        const response = await fetch(`${API_BASE}/api/orders/by-status?status=${status.value}`,{method:'GET'});
        if (response.ok) {
          const statusOrders = await response.json();
          allOrders.push(...statusOrders);
        }
      }

      allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(allOrders);
      setFilteredOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/orders`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await fetch(`${API_BASE}/api/orders/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: newStatus, lastUpdated: new Date().toISOString() }
              : order
          )
        );

        fetchAnalytics();
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  useEffect(() => {
    let filtered = orders;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(search) ||
        order.userName.toLowerCase().includes(search) ||
        order.userEmail.toLowerCase().includes(search) ||
        order.items.some(item => item.name.toLowerCase().includes(search))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, selectedStatus, searchTerm]);

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSinceOrder = (dateString) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchAnalytics();
    
    const interval = setInterval(() => {
      fetchAllOrders();
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Manager Dashboard</h1>
          <button 
            className="refresh-btn"
            onClick={() => {
              fetchAllOrders();
              fetchAnalytics();
            }}
            disabled={loading}
          >
            <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="analytics-section">
        <div className="analytics-card">
          <div className="analytics-content">
            <div className="analytics-number">{analytics.total_orders || 0}</div>
            <div className="analytics-label">Total Orders</div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-content">
            <div className="analytics-number">{analytics.today_orders || 0}</div>
            <div className="analytics-label">Today's Orders</div>
          </div>
        </div>
        {analytics.status_breakdown?.map((status) => {
          const statusInfo = getStatusInfo(status._id);
          const StatusIcon = statusInfo.icon;
          return (
            <div key={status._id} className="analytics-card">
              <div className="analytics-content">
                <div className="analytics-header">
                  <StatusIcon className="analytics-icon" style={{ color: statusInfo.color }} />
                  <div className="analytics-number">{status.count}</div>
                </div>
                <div className="analytics-label">{statusInfo.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-filter"
          >
            {statusFilters.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search orders, customers, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="orders-section">
        <div className="section-header">
          <h2 className="section-title">
            Orders ({filteredOrders.length})
          </h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw className="loading-spinner" />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-icon" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={order.orderId} className="order-card">
                  <div className="order-header">
                    <div className="order-id">#{order.orderId}</div>
                    <div className="order-time">{getTimeSinceOrder(order.orderDate)}</div>
                  </div>

                  <div className="order-customer">
                    <div className="customer-name">{order.userName}</div>
                    <div className="customer-email">{order.userEmail}</div>
                  </div>

                  <div className="order-items">
                    <div className="items-summary">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </div>
                    <div className="order-total">{formatCurrency(order.total)}</div>
                  </div>

                  <div className="order-status-section">
                    <div className="current-status">
                      <StatusIcon 
                        className="status-icon" 
                        style={{ color: statusInfo.color }}
                      />
                      <span className="status-label">{statusInfo.label}</span>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                      disabled={updating[order.orderId]}
                      className="status-select"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="order-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => showOrderDetails(order)}
                    >
                      <Eye className="action-icon" />
                      View Details
                    </button>
                  </div>

                  {updating[order.orderId] && (
                    <div className="updating-overlay">
                      <RefreshCw className="updating-spinner" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.orderId}</h3>
              <button className="modal-close" onClick={closeOrderModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="order-details-grid">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.userName}</p>
                  <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                  <p><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}</p>
                </div>

                <div className="detail-section">
                  <h4>Delivery Address</h4>
                  <p>{selectedOrder.address.street}</p>
                  <p>{selectedOrder.address.city}, {selectedOrder.address.state}</p>
                  <p>{selectedOrder.address.zipCode}, {selectedOrder.address.country}</p>
                </div>

                <div className="detail-section">
                  <h4>Order Items</h4>
                  <div className="items-list">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">×{item.quantity}</span>
                        <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Order Summary</h4>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Payment & Status</h4>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                  <p><strong>Current Status:</strong> {getStatusInfo(selectedOrder.status).label}</p>
                  {selectedOrder.appliedCoupon && (
                    <p><strong>Coupon Applied:</strong> {selectedOrder.appliedCoupon}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;