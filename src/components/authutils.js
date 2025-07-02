export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getCurrentUserRole = () => {
  return localStorage.getItem('userRole') || 'user';
};

export const isAuthenticated = () => {
  const user = getCurrentUser();
  return user && user.userid;
};

export const hasRole = (role) => {
  const userRole = getCurrentUserRole();
  return userRole === role;
};

export const hasAnyRole = (roles) => {
  const userRole = getCurrentUserRole();
  return roles.includes(userRole);
};

export const isOwner = () => {
  return hasRole('owner');
};

export const isManager = () => {
  return hasRole('manager');
};

export const isUser = () => {
  return hasRole('user');
};

export const isAdmin = () => {
  return hasAnyRole(['owner', 'manager']);
};

export const logout = () => {
  localStorage.removeItem('userData');
  localStorage.removeItem('userRole');
  window.location.href = '/';
};

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