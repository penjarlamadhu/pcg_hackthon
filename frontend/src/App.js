import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './Home';
import Dashboard from './Dashboard';
import Buyers from './Buyers';
import Sellers from './Sellers';
import Chat from './Chat';
import Login from './Login';
import Register from './Register';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    location: '',
    role: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Failed to restore user session:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setShowUserDropdown(false);
  };

  const handleUserDropdownToggle = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleEditProfile = () => {
    setEditFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      location: user.location,
      role: user.role
    });
    setShowEditProfile(true);
    setShowUserDropdown(false);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      ...editFormData
    };
    setUser(updatedUser);
    setShowEditProfile(false);
  };

  const handleEditCancel = () => {
    setShowEditProfile(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-info')) {
        setShowUserDropdown(false);
      }
      if (showEditProfile && !event.target.closest('.edit-profile-modal')) {
        setShowEditProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown, showEditProfile]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f7fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p>Initializing application</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleRegister} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>🏠 Real Estate AI</h1>
            <p>Intelligent Property Assistant</p>
          </div>
          <div className="header-nav">
            <nav className="nav-links">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/home" className="nav-link">Home</Link>
              <Link to="/buyers" className="nav-link">Buyers</Link>
              <Link to="/sellers" className="nav-link">Sellers</Link>
              <Link to="/chat" className="nav-link">💬 Chat</Link>
            </nav>
            <div className="header-actions">
              <div className="user-info" onClick={handleUserDropdownToggle} style={{ cursor: 'pointer' }}>
                <div className="user-avatar">
                  <div className="avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="user-details">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <span className="dropdown-arrow">▼</span>
              </div>
              
              {showUserDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-item" onClick={handleEditProfile}>
                    <span className="dropdown-icon">👤</span>
                    <span className="dropdown-text">Edit Profile</span>
                  </div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    <span className="dropdown-icon">�</span>
                    <span className="dropdown-text">Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/home" element={<Home user={user} />} />
          <Route path="/buyers" element={<Buyers />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
        
        {showEditProfile && (
          <div className="edit-profile-overlay">
            <div className="edit-profile-modal">
              <div className="edit-profile-header">
                <h2>Edit Profile</h2>
                <button onClick={handleEditCancel} className="close-button">×</button>
              </div>
              <form onSubmit={handleEditSubmit} className="edit-profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={editFormData.username}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editFormData.full_name}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditFormChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="agent">Agent</option>
                      <option value="moderator">Moderator</option>
                      <option value="broker">Broker</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-button">Save Changes</button>
                  <button type="button" onClick={handleEditCancel} className="cancel-button">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
