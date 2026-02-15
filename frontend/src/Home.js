import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch featured properties
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const [buyersRes, sellersRes] = await Promise.all([
          fetch('/api/buyers'),
          fetch('/api/sellers')
        ]);
        const buyersData = await buyersRes.json();
        const sellersData = await sellersRes.json();
        
        setProperties({
          buyers: buyersData.buyers || [],
          sellers: sellersData.sellers || []
        });
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Store search query and navigate to buyers page with filter
      sessionStorage.setItem('searchQuery', searchQuery);
      navigate('/buyers');
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    // Navigate to buyers page with category filter
    sessionStorage.setItem('propertyType', category);
    navigate('/buyers');
  };

  const handlePropertyClick = (property, type) => {
    setSelectedProperty({ ...property, type });
    setShowDetails(true);
  };

  const handleContactBuyer = (buyer) => {
    // Navigate to dashboard with pre-selected buyer
    sessionStorage.setItem('selectedBuyer', JSON.stringify(buyer));
    navigate('/dashboard');
  };

  const closeDetailsModal = () => {
    setShowDetails(false);
    setSelectedProperty(null);
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Find Your Perfect Property</h1>
          <p>Discover amazing properties or connect with serious buyers and sellers</p>
          
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by location, property type, or budget..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">🔍 Search</button>
          </form>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div 
          className="action-card"
          onClick={() => navigate('/buyers')}
        >
          <div className="action-icon">👥</div>
          <h3>Browse Buyers</h3>
          <p>{properties.buyers?.length || 0} Active Buyers</p>
        </div>
        
        <div 
          className="action-card"
          onClick={() => navigate('/sellers')}
        >
          <div className="action-icon">🏘️</div>
          <h3>Browse Sellers</h3>
          <p>{properties.sellers?.length || 0} Active Sellers</p>
        </div>
        
        <div 
          className="action-card"
          onClick={() => navigate('/chat')}
        >
          <div className="action-icon">💬</div>
          <h3>AI Chat Assistant</h3>
          <p>Get instant property advice</p>
        </div>
        
        <div 
          className="action-card"
          onClick={() => navigate('/dashboard')}
        >
          <div className="action-icon">📊</div>
          <h3>View Dashboard</h3>
          <p>See all platform statistics</p>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome, {user?.username || 'User'}! 👋</h2>
        <p>We're here to help you find your perfect property or sell your current one.</p>
      </div>

      {/* Featured Listings */}
      <div className="featured-section">
        <h2>Featured Buyers</h2>
        {loading ? (
          <div className="loading-text">Loading featured listings...</div>
        ) : (
          <div className="featured-grid">
            {properties.buyers?.slice(0, 3).map((buyer, index) => (
              <div key={index} className="featured-card">
                <div className="featured-badge">Featured</div>
                <h3 onClick={() => handlePropertyClick(buyer, 'buyer')} style={{ cursor: 'pointer' }}>
                  {buyer.name}
                </h3>
                <div className="featured-details">
                  <p><strong>Budget:</strong> {buyer.budget}</p>
                  <p><strong>Location:</strong> {buyer.location}</p>
                  <p><strong>Type:</strong> {buyer.property_type}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="contact-btn" 
                    onClick={() => handleContactBuyer(buyer)}
                  >
                    📞 Contact
                  </button>
                  <button 
                    className="contact-btn" 
                    onClick={() => handlePropertyClick(buyer, 'buyer')}
                  >
                    👁️ Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Categories */}
      <div className="categories-section">
        <h2>Browse by Property Type</h2>
        <div className="categories-grid">
          <div 
            className="category-card"
            onClick={() => handleCategoryClick('Houses')}
            style={{ cursor: 'pointer' }}
          >
            <div className="category-icon">🏠</div>
            <h3>Houses</h3>
            <p>Find single-family homes</p>
          </div>
          <div 
            className="category-card"
            onClick={() => handleCategoryClick('Apartments')}
            style={{ cursor: 'pointer' }}
          >
            <div className="category-icon">🏢</div>
            <h3>Apartments</h3>
            <p>Browse apartment listings</p>
          </div>
          <div 
            className="category-card"
            onClick={() => handleCategoryClick('Commercial')}
            style={{ cursor: 'pointer' }}
          >
            <div className="category-icon">🏗️</div>
            <h3>Commercial</h3>
            <p>Explore business spaces</p>
          </div>
          <div 
            className="category-card"
            onClick={() => handleCategoryClick('Villas')}
            style={{ cursor: 'pointer' }}
          >
            <div className="category-icon">🏘️</div>
            <h3>Villas</h3>
            <p>Luxury villa properties</p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Easy</h3>
            <p>Quick property search and connections with just a few clicks</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Powered</h3>
            <p>Smart recommendations powered by artificial intelligence</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Safe</h3>
            <p>Your data is protected with industry-standard security</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>24/7 Support</h3>
            <p>AI assistant available round the clock for your queries</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <h2>Our Platform by Numbers</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{properties.buyers?.length || 0}+</div>
            <div className="stat-label">Active Buyers</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🏘️</div>
            <div className="stat-number">{properties.sellers?.length || 0}+</div>
            <div className="stat-label">Active Sellers</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">✅</div>
            <div className="stat-number">95%</div>
            <div className="stat-label">Success Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🌍</div>
            <div className="stat-number">50+</div>
            <div className="stat-label">Cities Covered</div>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="market-insights">
        <h2>Market Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <h3>Price Trends</h3>
            <p>Real estate prices are trending up by 12% year-over-year in major cities</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🏡</div>
            <h3>High Demand Areas</h3>
            <p>Hyderabad, Bangalore, and Delhi are the hottest markets right now</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <h3>Best Investments</h3>
            <p>2-3 BHK properties offer the best ROI in the current market</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of satisfied buyers and sellers on our platform</p>
        <div className="cta-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => {
              sessionStorage.removeItem('propertyType');
              sessionStorage.removeItem('searchQuery');
              navigate('/buyers');
            }}
          >
            🔍 Start Searching
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/sellers')}
          >
            📢 List Your Property
          </button>
          <button 
            className="btn btn-tertiary"
            onClick={() => navigate('/chat')}
          >
            💬 Chat with AI
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedProperty && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetailsModal}>✕</button>
            <h2>{selectedProperty.name}</h2>
            <div className="modal-details">
              <div className="detail-row">
                <span className="label">Budget:</span>
                <span className="value">{selectedProperty.budget}</span>
              </div>
              <div className="detail-row">
                <span className="label">Location:</span>
                <span className="value">{selectedProperty.location}</span>
              </div>
              <div className="detail-row">
                <span className="label">Property Type:</span>
                <span className="value">{selectedProperty.property_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Contact:</span>
                <span className="value">{selectedProperty.contact || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{selectedProperty.email || 'Not provided'}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleContactBuyer(selectedProperty);
                  closeDetailsModal();
                }}
              >
                📞 Contact Now
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  navigate('/chat');
                  closeDetailsModal();
                }}
              >
                💬 Ask AI Assistant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
