import React, { useState } from 'react';
import './Register.css';

const Register = ({ onRegisterSuccess, isModal = false }) => {
  const [formData, setFormData] = useState({
    userid: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userid.trim()) {
      newErrors.userid = 'User ID is required';
    } else if (formData.userid.length < 3) {
      newErrors.userid = 'User ID must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('https://foodprepbackend-crj8.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: formData.userid,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          userid: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        if (isModal && onRegisterSuccess) {
          setTimeout(() => {
            onRegisterSuccess(data);
          }, 2000);
        } else {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        if (response.status === 409) {
          setErrors({ userid: 'User ID already exists' });
        } else {
          setErrors({ general: data.detail || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={isModal ? "register-form" : "register-container"}>
        <div className={isModal ? "success-message" : "register-form"}>
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Registration Successful!</h2>
            <p>Your account has been created successfully.</p>
            <p>{isModal ? 'Returning to login...' : 'Redirecting to login page...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? "register-form-modal" : "register-container"}>
      <div className="register-form">
        <div className="form-header">
          <h2>Create Account</h2>
          <p>Join us today and start your food prep journey</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="userid" className="form-label">
              User ID
            </label>
            <input
              type="text"
              id="userid"
              name="userid"
              value={formData.userid}
              onChange={handleChange}
              className={`form-input ${errors.userid ? 'error' : ''}`}
              placeholder="Enter your user ID"
              disabled={isLoading}
            />
            {errors.userid && (
              <span className="error-message">{errors.userid}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="form-footer">
          {!isModal && (
            <p>
              Already have an account?{' '}
              <a href="/login" className="login-link">
                Sign In
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;