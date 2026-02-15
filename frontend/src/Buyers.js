import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Buyers.css';

function Buyers() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBudget, setFilterBudget] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Check for search query or property type filter from home page
    const searchQuery = sessionStorage.getItem('searchQuery');
    const propertyType = sessionStorage.getItem('propertyType');
    
    if (searchQuery) {
      setSearchTerm(searchQuery);
      sessionStorage.removeItem('searchQuery');
    }
    
    if (propertyType) {
      setFilterPropertyType(propertyType);
      sessionStorage.removeItem('propertyType');
    }
    
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await axios.get('/api/buyers');
      setBuyers(response.data.buyers || []);
    } catch (error) {
      console.error('Error fetching buyers:', error);
      setBuyers([]);
    }
  };

  const handleAddBuyer = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newBuyer = {
      name: formData.get('name'),
      budget: formData.get('budget'),
      location: formData.get('location'),
      property_type: formData.get('property_type'),
      contact: formData.get('contact')
    };

    try {
      const response = await axios.post('/api/buyers', newBuyer);
      console.log('Buyer added successfully:', response.data);
      alert('Buyer added successfully!');
      setShowAddForm(false);
      fetchBuyers();
      e.target.reset();
    } catch (error) {
      console.error('Error adding buyer:', error);
      alert('Failed to add buyer. Please try again.');
    }
  };

  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBudget = filterBudget === 'all' || buyer.budget.includes(filterBudget);
    const matchesLocation = filterLocation === 'all' || buyer.location === filterLocation;
    const matchesPropertyType = filterPropertyType === 'all' || buyer.property_type === filterPropertyType;
    return matchesSearch && matchesBudget && matchesLocation && matchesPropertyType;
  });

  const getBudgetColor = (budget) => {
    if (budget.includes('30L') || budget.includes('35L') || budget.includes('40L') || budget.includes('45L')) return '#4CAF50';
    if (budget.includes('50L') || budget.includes('60L') || budget.includes('70L')) return '#FF9800';
    return '#F44336';
  };

  const handleContactBuyer = (buyer) => {
    // Store buyer info and navigate to chat or show contact modal
    sessionStorage.setItem('selectedBuyer', JSON.stringify(buyer));
    navigate('/chat');
  };

  const handleChatWithBuyer = (buyer) => {
    sessionStorage.setItem('selectedBuyer', JSON.stringify(buyer));
    sessionStorage.setItem('chatTopic', buyer.name);
    navigate('/chat');
  };

  return (
    <div className="buyers-container">
      <div className="buyers-header">
        <h1>👥 Property Buyers</h1>
        <p>Manage and track all potential property buyers</p>
      </div>

      <div className="buyers-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search buyers..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterPropertyType}
            onChange={(e) => setFilterPropertyType(e.target.value)}
          >
            <option value="all">All Property Types</option>
            <option value="Houses">Houses</option>
            <option value="Apartments">Apartments</option>
            <option value="Commercial">Commercial</option>
            <option value="Villas">Villas</option>
          </select>
          <select
            className="filter-select"
            value={filterBudget}
            onChange={(e) => setFilterBudget(e.target.value)}
          >
            <option value="all">All Budgets</option>
            <option value="30L">30L</option>
            <option value="40L">40L</option>
            <option value="50L">50L</option>
            <option value="60L">60L</option>
            <option value="70L">70L</option>
            <option value="80L">80L</option>
          </select>
          <select
            className="filter-select"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="all">All Locations</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Whitefield">Whitefield</option>
            <option value="Indiranagar">Indiranagar</option>
            <option value="Koramangala">Koramangala</option>
          </select>
        </div>
        <button className="add-button" onClick={() => setShowAddForm(true)}>
          + Add Buyer
        </button>
      </div>

      <div className="buyers-grid">
        {filteredBuyers.map((buyer, index) => (
          <div key={index} className="buyer-card">
            <div className="buyer-header">
              <h3>{buyer.name}</h3>
              <span className="budget" style={{ backgroundColor: getBudgetColor(buyer.budget) }}>
                {buyer.budget}
              </span>
            </div>
            <div className="buyer-info">
              <p><strong>Location:</strong> {buyer.location}</p>
              <p><strong>Property Type:</strong> {buyer.property_type}</p>
              <p><strong>Contact:</strong> {buyer.contact}</p>
            </div>
            <div className="buyer-actions">
              <button 
                className="chat-button"
                onClick={() => handleChatWithBuyer(buyer)}
              >
                💬 Chat
              </button>
              <button 
                className="contact-button"
                onClick={() => handleContactBuyer(buyer)}
              >
                📞 Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Buyer</h2>
              <button onClick={() => setShowAddForm(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleAddBuyer} className="add-buyer-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>Budget</label>
                <input type="text" name="budget" placeholder="e.g., 50L" required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" required />
              </div>
              <div className="form-group">
                <label>Property Type</label>
                <input type="text" name="property_type" placeholder="e.g., 2BHK" required />
              </div>
              <div className="form-group">
                <label>Contact</label>
                <input type="text" name="contact" required />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">Add Buyer</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buyers;
