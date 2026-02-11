import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TransactionForm = ({ fabric, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fabric_id: fabric?.id || '',
    transaction_type: 'in',
    quantity: '',
    unit_price: fabric?.price_per_unit || '',
    reference: '',
    transaction_source: '',
    payment_mode: ''
  });

  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const transactionSources = [
    'Amazon', 'Amazon Warehouse', 'Meesho', 'Own Website', 'IndiaMart', 
    'Flipkart', 'Shopify', 'Instagram', 'WhatsApp', 'Offline Store', 'Other'
  ];

  const paymentModes = [
    'GPay', 'PhonePe', 'Paytm', 'Google Pay', 'Bank Transfer', 'NEFT', 
    'RTGS', 'IMPS', 'Cash', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'Other'
  ];

  // Fetch fabrics immediately to determine numbers/indices
  useEffect(() => {
    fetchFabrics();
  }, []);

  // Update form data when fabric prop changes or fabrics list loads
  useEffect(() => {
    if (fabric) {
      setFormData(prev => ({
        ...prev,
        fabric_id: fabric.id,
        unit_price: fabric.price_per_unit
      }));
    }
  }, [fabric]);

  const fetchFabrics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fabrics');
      setFabrics(response.data);
    } catch (error) {
      console.error('Error fetching fabrics:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update unit price when fabric is selected
    if (name === 'fabric_id') {
      const selectedFabric = fabrics.find(f => f.id == value);
      if (selectedFabric) {
        setFormData(prev => ({
          ...prev,
          unit_price: selectedFabric.price_per_unit
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalValue = formData.quantity * formData.unit_price;
      const transactionData = {
        ...formData,
        total_value: totalValue
      };

      await axios.post('http://localhost:5000/api/transactions', transactionData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Error adding transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Helper to find the index number of the currently selected fabric
  const getSelectedFabricNumber = () => {
    if (!fabric && !formData.fabric_id) return null;
    const idToCheck = fabric ? fabric.id : formData.fabric_id;
    const index = fabrics.findIndex(f => f.id === idToCheck);
    return index !== -1 ? index + 1 : '?';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Add Transaction
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fabric Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fabric *
            </label>
            
            {/* If fabric is pre-selected (passed as prop), we show a read-only box.
               We now dynamically find its index (1, 2, 3) to show the user.
            */}
            {fabric ? (
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 font-medium">
                {getSelectedFabricNumber()}. {fabric.name}
              </div>
            ) : (
              <select
                name="fabric_id"
                value={formData.fabric_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Fabric</option>
                {fabrics.map((f, index) => (
                  <option key={f.id} value={f.id}>
                    {/* Strictly displays 1, 2, 3... hiding the internal ID */}
                    {index + 1}. {f.name} - {f.type}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type *
              </label>
              <select
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </select>
            </div>

            {/* Quantity */}
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

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference/Order ID
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Order #12345"
              />
            </div>
          </div>

          {/* Transaction Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Source *
            </label>
            <select
              name="transaction_source"
              value={formData.transaction_source}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Source</option>
              {transactionSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Mode *
            </label>
            <select
              name="payment_mode"
              value={formData.payment_mode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Payment Mode</option>
              {paymentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          {/* Total Value Display */}
          {formData.quantity && formData.unit_price && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">Total Value:</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(formData.quantity * formData.unit_price)}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;