import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Sellers.css';

function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await axios.get('/api/sellers');
      setSellers(response.data.sellers || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setSellers([]);
    }
  };

  const handleAddSeller = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSeller = {
      name: formData.get('name'),
      property_type: formData.get('property_type'),
      location: formData.get('location'),
      price: formData.get('price'),
      contact: formData.get('contact')
    };

    try {
      const response = await axios.post('/api/sellers', newSeller);
      console.log('Seller added successfully:', response.data);
      alert('Seller added successfully!');
      setShowAddForm(false);
      fetchSellers();
      e.target.reset();
    } catch (error) {
      console.error('Error adding seller:', error);
      alert('Failed to add seller. Please try again.');
    }
  };

  const handleChatWithSeller = (seller) => {
    setSelectedSeller(seller);
    setShowChat(true);
    setChatHistory([
      { sender: 'system', message: `Chat started with ${seller.name}`, timestamp: new Date() }
    ]);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedSeller) return;

    const newMessage = {
      sender: 'user',
      message: chatMessage,
      timestamp: new Date()
    };

    setChatHistory([...chatHistory, newMessage]);
    
    // Simulate seller response
    setTimeout(() => {
      const response = {
        sender: 'seller',
        message: `Thank you for your inquiry! I have a ${selectedSeller.property_type} available in ${selectedSeller.location} for ${selectedSeller.price}. Would you like to schedule a viewing?`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, response]);
    }, 1000);

    setChatMessage('');
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || seller.location === filterLocation;
    const matchesPropertyType = filterPropertyType === 'all' || seller.property_type === filterPropertyType;
    return matchesSearch && matchesLocation && matchesPropertyType;
  });

  const getPriceColor = (price) => {
    if (price.includes('30L') || price.includes('35L') || price.includes('40L') || price.includes('45L')) return '#4CAF50';
    if (price.includes('50L') || price.includes('60L') || price.includes('70L')) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="sellers-container">
      <div className="sellers-header">
        <h1>🏘️ Property Sellers</h1>
        <p>Manage and track all property sellers and listings</p>
      </div>

      <div className="sellers-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search sellers..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          <select
            className="filter-select"
            value={filterPropertyType}
            onChange={(e) => setFilterPropertyType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="1BHK">1BHK</option>
            <option value="2BHK">2BHK</option>
            <option value="3BHK">3BHK</option>
            <option value="4BHK">4BHK</option>
            <option value="Villa">Villa</option>
          </select>
        </div>
        <button className="add-button" onClick={() => setShowAddForm(true)}>
          + Add Seller
        </button>
      </div>

      <div className="sellers-grid">
        {filteredSellers.map((seller, index) => (
          <div key={index} className="seller-card">
            <div className="seller-header">
              <h3>{seller.name}</h3>
              <span className="price" style={{ backgroundColor: getPriceColor(seller.price) }}>
                {seller.price}
              </span>
            </div>
            <div className="seller-info">
              <p><strong>Property Type:</strong> {seller.property_type}</p>
              <p><strong>Location:</strong> {seller.location}</p>
              <p><strong>Contact:</strong> {seller.contact}</p>
            </div>
            <div className="seller-actions">
              <button className="chat-button">💬 Chat</button>
              <button className="contact-button">📞 Contact</button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Seller</h2>
              <button onClick={() => setShowAddForm(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleAddSeller} className="add-seller-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>Property Type</label>
                <input type="text" name="property_type" placeholder="e.g., 2BHK" required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" required />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="text" name="price" placeholder="e.g., 45L" required />
              </div>
              <div className="form-group">
                <label>Contact</label>
                <input type="text" name="contact" required />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">Add Seller</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sellers;
