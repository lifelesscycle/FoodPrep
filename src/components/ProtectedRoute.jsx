import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = localStorage.getItem('userRole') || 'user';

  if (!userData.userid) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ marginBottom: '20px' }}>You don't have permission to access this page.</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Your role: <strong>{userRole}</strong>
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;