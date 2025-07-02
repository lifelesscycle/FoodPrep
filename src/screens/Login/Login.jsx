import React, { useState } from 'react';
import './Login.css';
import Register from './../Register/Register';

const Login = ({ isOpen, onClose, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://foodprepbackend-crj8.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        const userData = {
          email: data.user.email,
          name: data.user.name,
          userid: data.user.userid,
          role: data.user.role || 'user' // Default to 'user' if role not provided
        };
        
        // Store user data in localStorage for role-based access control
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userRole', userData.role);
        
        onLogin(userData);
        onClose();
        setFormData({ email: '', password: '' });

        // Role-based redirection
        if (userData.role === 'owner' ) {
          window.location.href = '/Dashboard';
        } else if (userData.role === 'manager'){
          window.location.href = '/ManagerDashboard'; // Fixed typo here
        } else {
          window.location.href = '/';
        }
      } else {
        // Login failed
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
    setError('');
    setFormData({ email: '', password: '' });
  };

  const handleRegisterSuccess = (userData) => {
    setShowRegister(false);
    setError('');
    setFormData({ email: '', password: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="Overlay" onClick={handleBackdropClick}>
      <div className="Blur-Background">
        <div className="Main-form-container">
          <button className="Close-button" onClick={onClose}>
            ×
          </button>
          
          {!showRegister ? (
            <>
              <h2 className="Wel">Welcome Back</h2>
              <p className="SignIN">Sign in to your account</p>

              <form onSubmit={handleSubmit} className="Form">
                <div className="Form-group">
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="Input-label"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="Form-group">
                  <label htmlFor="password" className="label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="Input-label"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && <div className="ErrorMessage">{error}</div>}

                <button 
                  type="submit" 
                  className={`bt ${isLoading ? 'load' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className='NewUser'>
                <a href='#' className='Newuser' onClick={handleRegisterClick}>
                  Register Now
                </a>
              </div>

              <div className="ft">
                <a href="#" className="fk">Forgot password?</a>
              </div>
            </>
          ) : (
            <div className="register-wrapper">
              <button 
                className="back-to-login-btn" 
                onClick={handleBackToLogin}
                type="button"
              >
                ← Back to Login
              </button>
              <Register 
                onRegisterSuccess={handleRegisterSuccess}
                isModal={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;