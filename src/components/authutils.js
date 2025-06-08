// authUtils.js - Utility functions for authentication and role management

// Get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Get current user role
export const getCurrentUserRole = () => {
  return localStorage.getItem('userRole') || 'user';
};

// Check if user is logged in
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return user && user.userid;
};

// Check if user has specific role
export const hasRole = (role) => {
  const userRole = getCurrentUserRole();
  return userRole === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const userRole = getCurrentUserRole();
  return roles.includes(userRole);
};

// Check if user is owner
export const isOwner = () => {
  return hasRole('owner');
};

// Check if user is manager
export const isManager = () => {
  return hasRole('manager');
};

// Check if user is regular user
export const isUser = () => {
  return hasRole('user');
};

// Check if user is admin (owner or manager)
export const isAdmin = () => {
  return hasAnyRole(['owner', 'manager']);
};

// Logout function
export const logout = () => {
  localStorage.removeItem('userData');
  localStorage.removeItem('userRole');
  window.location.href = '/';
};

// Get user display name with role
export const getUserDisplayInfo = () => {
  const user = getCurrentUser();
  const role = getCurrentUserRole();
  
  if (!user) return null;
  
  return {
    name: user.name,
    email: user.email,
    role: role,
    displayName: `${user.name} (${role.charAt(0).toUpperCase() + role.slice(1)})`
  };
};