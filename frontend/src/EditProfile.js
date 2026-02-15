import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditProfile.css';

function EditProfile({ user, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    phone: '',
    bio: '',
    location: '',
    company: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    // Load existing profile data
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get('/api/user/profile');
      if (response.data.profile) {
        setFormData(response.data.profile);
        if (response.data.profile.profilePicture) {
          setPreviewUrl(`/uploads/${response.data.profile.profilePicture}`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        setMessageType('error');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file');
        setMessageType('error');
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      const response = await axios.put('/api/user/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Profile updated successfully!');
      setMessageType('success');
      
      // Update user data in parent component
      if (onProfileUpdate) {
        onProfileUpdate(response.data.user);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
    document.getElementById('profilePictureInput').value = '';
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h2>Edit Profile</h2>
        <p>Update your personal information and profile picture</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="profile-picture-section">
          <div className="current-picture">
            <div className="picture-container">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="profile-preview" />
              ) : (
                <div className="placeholder-avatar">
                  <span className="avatar-text">{formData.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="picture-actions">
              <label htmlFor="profilePictureInput" className="upload-btn">
                <span className="upload-icon">📷</span>
                Upload Picture
              </label>
              <input
                id="profilePictureInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {previewUrl && (
                <button type="button" onClick={removeProfilePicture} className="remove-btn">
                  Remove
                </button>
              )}
            </div>
            <p className="upload-hint">
              JPG, PNG or GIF (Max 5MB)
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Bangalore, India"
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Real Estate Agency"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="save-btn">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="cancel-btn" onClick={() => window.history.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;
