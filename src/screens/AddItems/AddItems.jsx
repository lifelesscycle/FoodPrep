import React, { useState } from 'react';
import './AddItems.css';

const AddItem = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const categories = [
    'Salad',
    'Rolls',
    'Deserts',
    'Sandwich',
    'Cake',
    'Pure Veg',
    'Pasta',
    'Noodles'
  ];

  const handleInputChange = (e) => {
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file (JPEG, PNG, WEBP)'
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.image) {
      newErrors.image = 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const newId = Date.now().toString();
      
      const formDataToSend = new FormData();
      formDataToSend.append('id', newId);
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('price', parseFloat(formData.price).toString());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('image', formData.image);

      const response = await fetch('https://foodprepbackend-crj8.onrender.com/api/food/add', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSubmitMessage(`✅ ${result.message}`);
        
        setFormData({
          name: '',
          price: '',
          description: '',
          category: '',
          image: null
        });
        setImagePreview(null);
        setErrors({});
        
        const fileInput = document.getElementById('image');
        if (fileInput) {
          fileInput.value = '';
        }
        
        setTimeout(() => {
          setSubmitMessage('');
        }, 5000);
      } else {
        throw new Error(result.message || 'Failed to add menu item');
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      setSubmitMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      image: null
    });
    setImagePreview(null);
    setErrors({});
    setSubmitMessage('');
    
    const fileInput = document.getElementById('image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="add-menu-item">
      <div className="container">
        <h1 className="page-title">Add New Menu Item</h1>
        
        <div className="menu-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter item name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={errors.price ? 'error' : ''}
                placeholder="Enter price"
                min="1"
                step="0.01"
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Enter item description"
              rows="4"
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="image">Item Image *</label>
            <div className="image-upload-section">
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className={errors.image ? 'error' : ''}
              />
              {errors.image && <span className="error-message">{errors.image}</span>}
              
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <p>Image Preview</p>
                </div>
              )}
            </div>
          </div>

          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('✅') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Adding Item...
                </>
              ) : (
                'Add Menu Item'
              )}
            </button>
            <button 
              type="button" 
              className="reset-btn"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;