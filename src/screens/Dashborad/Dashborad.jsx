import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  BarChart3, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  XCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import './Dashboard.css'

const API_BASE_URL = 'https://foodprep-1w7j.onrender.com';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const AnalyticsOverview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/orders`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  const statusIcons = {
    confirmed: <Clock className="status-icon confirmed" />,
    preparing: <AlertCircle className="status-icon preparing" />,
    out_for_delivery: <Truck className="status-icon delivery" />,
    delivered: <CheckCircle className="status-icon delivered" />,
    cancelled: <XCircle className="status-icon cancelled" />
  };

  return (
    <div className="analytics-content">
      <div className="analytics-cards">
        <div className="analytics-card total-orders">
          <div className="card-icon">
            <Package />
          </div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p className="card-number">{analytics?.total_orders || 0}</p>
          </div>
        </div>

        <div className="analytics-card today-orders">
          <div className="card-icon">
            <TrendingUp />
          </div>
          <div className="card-content">
            <h3>Today's Orders</h3>
            <p className="card-number">{analytics?.today_orders || 0}</p>
          </div>
        </div>
      </div>

      <div className="status-breakdown">
        <h3>Order Status Breakdown</h3>
        <div className="status-grid">
          {analytics?.status_breakdown?.map((status, index) => (
            <div key={index} className={`status-card status-${status._id}`}>
              {statusIcons[status._id]}
              <div className="status-details">
                <h4>{status._id.replace('_', ' ').toUpperCase()}</h4>
                <p className="status-count">{status.count} orders</p>
                <p className="status-amount">₹{status.total_amount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('confirmed');
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchOrdersByStatus(selectedStatus);
  }, [selectedStatus]);

  const fetchOrdersByStatus = async (status) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/by-status?status=${status}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus
        })
      });
      
      if (response.ok) {
        fetchOrdersByStatus(selectedStatus);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="orders-content">
      <div className="orders-header">
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

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.orderId} className={`order-card order-${order.status}`}>
              <div className="order-header">
                <h3 className="order-id">#{order.orderId}</h3>
                <span className={`order-status status-${order.status}`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="order-details">
                <p className="customer-info">
                  <strong>{order.userName}</strong> - {order.userEmail}
                </p>
                <p className="order-total">₹{order.total?.toFixed(2)}</p>
                <p className="order-date">
                  Order Date: {new Date(order.orderDate).toLocaleDateString()}
                </p>
              </div>

              <div className="order-items">
                <h4>Items ({order.items?.length || 0}):</h4>
                {order.items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <p className="more-items">+{order.items.length - 3} more items</p>
                )}
              </div>

              <div className="order-actions">
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
      )}

      {!loading && orders.length === 0 && (
        <div className="no-orders">
          <p>No orders found with status: {selectedStatus}</p>
        </div>
      )}
    </div>
  );
};

const UserManagement = () => {
  return (
    <div className="user-content">
      <div className="placeholder-content">
        <p>User management features coming soon...</p>
        <p>This section will include user registration, role management, and user analytics.</p>
      </div>
    </div>
  );
};

const SettingsManagement = () => {
  const [formData, setFormData] = useState({
    userid: "",
    password: "",
    email: "",
    role: "user"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async () => {
    if (!formData.userid || !formData.email || !formData.password) {
      setMessage("Please fill in all required fields");
      setMessageType("error");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("https://foodprep-1w7j.onrender.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType("success");
        setFormData({
          userid: "",
          password: "",
          email: "",
          role: "user"
        });
      } else {
        setMessage(data.detail || "Registration failed");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error occurred. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2 className="settings-title">Settings Management</h2>
        <p className="settings-description">Manage system configuration and user accounts</p>
      </div>

      <div className="user-registration-section">
        <h3 className="registration-title">Create New User Account</h3>
        
        <div className="registration-form">
          <div className="form-group">
            <div className="form-label">User ID</div>
            <input
              type="text"
              name="userid"
              className="form-input"
              value={formData.userid}
              onChange={handleInputChange}
              placeholder="Enter unique user ID"
            />
          </div>

          <div className="form-group">
            <div className="form-label">Email Address</div>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <div className="form-label">Password</div>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <div className="form-label">User Role</div>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <button 
            className="submit-button"
            disabled={loading}
            onClick={handleFormSubmit}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>

        {message && (
          <div className={`message-display ${messageType}`}>
            {message}
          </div>
        )}
      </div>

      <div className="additional-settings-section">
        <h3 className="section-title">Additional Settings</h3>
        <div className="placeholder-content">
          <p>System configuration and preferences panel coming soon...</p>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const OwnerDashboard = () => {
  const [activeModal, setActiveModal] = useState(null);

  const dashboardSections = [
    {
      id: 'analytics',
      title: 'Analytics Overview',
      description: 'View sales analytics and order statistics',
      icon: <BarChart3 size={48} />,
      component: AnalyticsOverview,
      color: 'bg-blue-500'
    },
    {
      id: 'orders',
      title: 'Orders Management',
      description: 'Manage and track all customer orders',
      icon: <Package size={48} />,
      component: OrdersManagement,
      color: 'bg-green-500'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage customers and user accounts',
      icon: <Users size={48} />,
      component: UserManagement,
      color: 'bg-purple-500'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure system settings and preferences',
      icon: <Settings size={48} />,
      component: SettingsManagement,
      color: 'bg-orange-500'
    }
  ];

  const openModal = (sectionId) => {
    setActiveModal(sectionId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const navigateToPage = (url) => {
    window.open(url, '_blank');
    
    
    const navigate = useNavigate();
    navigate(url);
  };

  const activeSection = dashboardSections.find(section => section.id === activeModal);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">Owner Dashboard</h1>
            <p className="dashboard-subtitle">Manage your business operations</p>
          </div>
          
          <div className="header-actions">
            <button className="nav-button primary-nav" onClick={() => navigateToPage('/add-items')}><span>Add Item to Menu</span></button>
          </div>

        </div>
      </header>

      <div className="dashboard-grid">
        {dashboardSections.map((section) => (
          <div 
            key={section.id}
            className={`dashboard-card ${section.color}`}
            onClick={() => openModal(section.id)}
          >
            <div className="card-icon-container">
              {section.icon}
            </div>
            <div className="card-content">
              <h3 className="card-title">{section.title}</h3>
              <p className="card-description">{section.description}</p>
            </div>
            <div className="card-hover-overlay">
              <span>Click to open</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal 
        isOpen={!!activeModal} 
        onClose={closeModal}
        title={activeSection?.title || ''}
      >
        {activeSection && <activeSection.component />}
      </Modal>
    </div>
  );
};

export default OwnerDashboard;
