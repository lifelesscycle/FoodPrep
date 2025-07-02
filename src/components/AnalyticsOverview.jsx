import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  XCircle
} from 'lucide-react';

const API_BASE_URL = 'https://foodprepbackend-crj8.onrender.com';

const AnalyticsOverview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/analytics/orders`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const statusIcons = {
    confirmed: <Clock className="status-icon confirmed" />,
    preparing: <AlertCircle className="status-icon preparing" />,
    out_for_delivery: <Truck className="status-icon delivery" />,
    delivered: <CheckCircle className="status-icon delivered" />,
    cancelled: <XCircle className="status-icon cancelled" />
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusDisplayName = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="analytics-overview">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-overview">
        <div className="analytics-error">
          <AlertCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = analytics?.status_breakdown?.reduce(
    (sum, status) => sum + (status.total_amount || 0), 
    0
  ) || 0;

  return (
    <div className="analytics-overview">
      <div className="analytics-header">
        <h2 className="analytics-title">Analytics Overview</h2>
        <button onClick={fetchAnalytics} className="refresh-button">
          Refresh Data
        </button>
      </div>
      
      <div className="analytics-cards">
        <div className="analytics-card total-orders">
          <div className="card-icon">
            <Package />
          </div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p className="card-number">{analytics?.total_orders || 0}</p>
            <span className="card-subtitle">All time orders</span>
          </div>
        </div>

        <div className="analytics-card today-orders">
          <div className="card-icon">
            <TrendingUp />
          </div>
          <div className="card-content">
            <h3>Today's Orders</h3>
            <p className="card-number">{analytics?.today_orders || 0}</p>
            <span className="card-subtitle">Orders placed today</span>
          </div>
        </div>

        <div className="analytics-card total-revenue">
          <div className="card-icon">
            <TrendingUp />
          </div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-number">{formatCurrency(totalRevenue)}</p>
            <span className="card-subtitle">All orders combined</span>
          </div>
        </div>

        <div className="analytics-card avg-order">
          <div className="card-icon">
            <Package />
          </div>
          <div className="card-content">
            <h3>Average Order</h3>
            <p className="card-number">
              {formatCurrency(analytics?.total_orders > 0 ? totalRevenue / analytics.total_orders : 0)}
            </p>
            <span className="card-subtitle">Per order value</span>
          </div>
        </div>
      </div>

      <div className="status-breakdown">
        <h3>Order Status Breakdown</h3>
        <div className="status-grid">
          {analytics?.status_breakdown?.map((status, index) => (
            <div key={index} className={`status-card status-${status._id}`}>
              {statusIcons[status._id] || <Package className="status-icon default" />}
              <div className="status-details">
                <h4>{getStatusDisplayName(status._id)}</h4>
                <p className="status-count">{status.count} orders</p>
                <p className="status-amount">{formatCurrency(status.total_amount)}</p>
                <div className="status-percentage">
                  {analytics.total_orders > 0 && (
                    <span>{((status.count / analytics.total_orders) * 100).toFixed(1)}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(!analytics?.status_breakdown || analytics.status_breakdown.length === 0) && (
          <div className="no-data">
            <p>No order data available</p>
          </div>
        )}
      </div>

      <div className="analytics-insights">
        <h3>Quick Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Common Status</h4>
            <p>
              {analytics?.status_breakdown?.length > 0 
                ? getStatusDisplayName(
                    analytics.status_breakdown.reduce((prev, current) => 
                      (prev.count > current.count) ? prev : current
                    )._id
                  )
                : 'No data'
              }
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Completion Rate</h4>
            <p>
              {analytics?.status_breakdown?.length > 0 
                ? (() => {
                    const delivered = analytics.status_breakdown.find(s => s._id === 'delivered');
                    const total = analytics.total_orders;
                    return total > 0 ? `${((delivered?.count || 0) / total * 100).toFixed(1)}%` : '0%';
                  })()
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;