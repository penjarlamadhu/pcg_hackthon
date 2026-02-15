import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard({ user }) {
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchBuyers();
    fetchSellers();
    fetchProperties();
    fetchRecentActivity();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await fetch('/api/buyers');
      const data = await response.json();
      setBuyers(data.buyers || []);
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await fetch('/api/sellers');
      const data = await response.json();
      setSellers(data.sellers || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/recent-activity');
      const data = await response.json();
      setRecentActivity(data.activities || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getStatCard = (title, value, icon, color) => (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{title}</div>
    </div>
  );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Real Estate Dashboard</h1>
        <p>Comprehensive overview of your real estate business</p>
      </div>

      <div className="stats-grid">
        {getStatCard("Total Buyers", buyers.length, "👥", "#4CAF50")}
        {getStatCard("Total Sellers", sellers.length, "🏘️", "#FF9800")}
        {getStatCard("Total Properties", properties.length, "🏠", "#667eea")}
        {getStatCard("Active Chats", 0, "💬", "#2196F3")}
        {getStatCard("New Inquiries", 0, "📝", "#9C27B0")}
      </div>

      <div className="dashboard-content">
        <div className="content-row">
          <div className="recent-activity">
            <h3>📈 Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-icon">
                    {activity.type === 'buyer' ? '👤' : activity.type === 'seller' ? '🏘️' : '💬'}
                  </span>
                  <span className="activity-text">{activity.name}</span>
                  <span className="activity-time">{formatTime(activity.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overview-cards">
            <div className="overview-section">
              <h3>👤 User Profile</h3>
              <div className="user-profile-card">
                <div className="user-profile-header">
                  <div className="user-avatar-large">
                    <div className="avatar-placeholder-large">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="user-info-large">
                    <h4>{user.full_name || user.username}</h4>
                    <p className="user-role-large">{user.role}</p>
                    <div className="user-details-large">
                      <p><strong>📧 Email:</strong> {user.email}</p>
                      <p><strong>📞 Phone:</strong> {user.phone}</p>
                      <p><strong>📍 Location:</strong> {user.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
