import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SafeImage from './SafeImage';

// 1. Accept 'nextId' as a prop from the parent component
const AddFabricForm = ({ fabric, onSubmit, onClose, nextId }) => {
  const [formData, setFormData] = useState({
    fabric_number: '', 
    name: '',
    type: '',
    color: '',
    pattern: '',
    quantity: '',
    unit: 'meters',
    price_per_unit: '',
    supplier: '',
    description: '',
    image: null,
    existing_image: ''
  });

  const fabricTypes = [
    'Cotton', 'Silk', 'Wool', 'Linen', 'Polyester', 'Nylon', 
    'Rayon', 'Velvet', 'Denim', 'Canvas', 'Satin', 'Chiffon'
  ];

  const units = ['meters', 'yards', 'feet', 'kilograms', 'pounds', 'rolls', 'pieces'];

  useEffect(() => {
    if (fabric) {
      // EDIT MODE: Use the existing fabric number
      setFormData({
        fabric_number: fabric.fabric_number || fabric.id,
        name: fabric.name || '',
        type: fabric.type || '',
        color: fabric.color || '',
        pattern: fabric.pattern || '',
        quantity: fabric.quantity || '',
        unit: fabric.unit || 'meters',
        price_per_unit: fabric.price_per_unit || '',
        supplier: fabric.supplier || '',
        description: fabric.description || '',
        image: null,
        existing_image: fabric.image_url || ''
      });
    } else {
      // ADD MODE: Use the passed nextId (Count + 1)
      setFormData(prev => ({
        ...prev,
        fabric_number: nextId // Sets the ID automatically
      }));
    }
  }, [fabric, nextId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (fabric) {
      onSubmit(fabric.id, submitData);
    } else {
      onSubmit(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {fabric ? 'Edit Fabric' : 'Add New Fabric'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            
            {/* --- FABRIC ID FIELD (Read Only) --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fabric ID
              </label>
              <input
                type="text"
                name="fabric_number"
                value={formData.fabric_number}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-100 text-gray-600 font-bold cursor-not-allowed"
              />
            </div>
            {/* ----------------------------------- */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fabric Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Premium Cotton"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fabric Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                {fabricTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Blue, Red, Multi-color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pattern
              </label>
              <input
                type="text"
                name="pattern"
                value={formData.pattern}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Striped, Plain, Floral"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Unit *
              </label>
              <input
                type="number"
                name="price_per_unit"
                value={formData.price_per_unit}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about the fabric..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fabric Image
            </label>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.existing_image && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Current image:</p>
                <SafeImage
                  src={formData.existing_image}
                  alt="Current fabric"
                  className="h-20 w-20 object-cover rounded mt-1"
                  fallbackText="No image"
                  fallbackClassName="h-20 w-20 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs mt-1"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {fabric ? 'Update Fabric' : 'Add Fabric'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFabricForm;