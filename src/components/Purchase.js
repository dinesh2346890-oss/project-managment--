import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, ShoppingCartIcon, BuildingOfficeIcon, TruckIcon, CheckCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import PurchaseForm from './PurchaseForm';
import BillPreview from './BillPreview';

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchPurchases(),
      fetchFabrics(),
      fetchTransactions()
    ]);
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/purchases');
      setPurchases(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    }
  };

  const fetchFabrics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fabrics');
      setFabrics(response.data || []);
    } catch (error) {
      console.error('Error fetching fabrics:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions');
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddPurchase = () => {
    setEditingPurchase(null);
    setShowPurchaseForm(true);
  };

  const handleEditPurchase = (groupedOrder) => {
    setEditingPurchase(groupedOrder); 
    setShowPurchaseForm(true);
  };

  const handleViewBill = (groupedOrder) => {
    const previewData = {
        ...groupedOrder.items[0], 
        total_amount: groupedOrder.totalAmount, 
        items: groupedOrder.items 
    };
    setSelectedPurchase(previewData);
    setShowBillPreview(true);
  };

  const handleDeletePurchase = async (groupedOrder) => {
    if (window.confirm(`Are you sure you want to delete Order #${groupedOrder.orderNumber}? This will delete all ${groupedOrder.items.length} items.`)) {
      try {
        await Promise.all(groupedOrder.items.map(item => 
            axios.delete(`http://localhost:5000/api/purchases/${item.id}`)
        ));
        fetchAllData();
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  const handlePurchaseSubmit = async (purchaseData) => {
    try {
      if (editingPurchase && editingPurchase.id) {
         await axios.post('http://localhost:5000/api/purchases', purchaseData); 
      } else {
         await axios.post('http://localhost:5000/api/purchases', purchaseData);
      }
      
      await fetchAllData();
      setShowPurchaseForm(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert("Failed to save purchase. Check console for details.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // --- GROUPING LOGIC ---
  const getGroupedPurchases = () => {
    const rawPurchases = Array.isArray(purchases) ? purchases : [];
    
    const groups = rawPurchases.reduce((acc, curr) => {
        const orderNo = curr.order_number || `TRX-${curr.id}`;
        
        if (!acc[orderNo]) {
            acc[orderNo] = {
                id: curr.id, 
                orderNumber: orderNo,
                supplier: curr.supplier_name,
                
                mobile: curr.supplier_phone,
                email: curr.supplier_email,
                payment_terms: curr.payment_terms,
                notes: curr.notes,
                
                status: curr.status,
                orderDate: curr.order_date,
                expectedDate: curr.expected_delivery_date,
                items: [],
                totalAmount: 0,
                fabricNames: new Set()
            };
        }
        
        acc[orderNo].items.push(curr);
        acc[orderNo].totalAmount += (parseFloat(curr.total_amount) || 0);
        
        const fabricName = curr.fabric_name || (fabrics.find(f => f.id === curr.fabric_id)?.name) || 'Unknown';
        acc[orderNo].fabricNames.add(fabricName);
        
        return acc;
    }, {});

    return Object.values(groups).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  };

  const groupedPurchases = getGroupedPurchases();

  const filteredPurchases = groupedPurchases.filter(group => {
    const fabricString = Array.from(group.fabricNames).join(' ').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = 
        (group.supplier || '').toLowerCase().includes(search) ||
        (group.orderNumber || '').toLowerCase().includes(search) ||
        fabricString.includes(search);
    
    const matchesStatus = filterStatus === 'all' || group.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalSpent = filteredPurchases
    .filter(p => p.status === 'received')
    .reduce((sum, p) => sum + p.totalAmount, 0) +
    transactions
      .filter(t => t.transaction_type === 'in' && t.transaction_source === 'Purchase')
      .reduce((sum, t) => sum + (t.total_value || 0), 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Management</h2>
          <p className="text-gray-600 mt-1">Manage your fabric purchases and orders</p>
        </div>
        <button
          onClick={handleAddPurchase}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Purchase
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Received Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {groupedPurchases.filter(p => p.status === 'received').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TruckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">
                {groupedPurchases.filter(p => p.status === 'ordered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(groupedPurchases.map(p => p.supplier)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by supplier, order, or fabric..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="ordered">Ordered</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* RENAMED COLUMN HEADER */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fabrics</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((group, index) => (
                <tr key={group.orderNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {/* UPDATED TO SHOW INDEX NUMBER (1, 2, 3) INSTEAD OF ORDER NUMBER */}
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.supplier}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                        {Array.from(group.fabricNames).map((name, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 rounded px-1 py-0.5 border border-gray-200">{name}</span>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.items.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(group.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(group.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(group.status)}`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button onClick={() => handleViewBill(group)} className="text-green-600 hover:text-green-900" title="View Bill">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleEditPurchase(group)} className="text-blue-600 hover:text-blue-900" title="Edit">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeletePurchase(group)} className="text-red-600 hover:text-red-900" title="Delete">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPurchases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No purchases found
            </div>
          )}
        </div>
      </div>

      {showPurchaseForm && (
        <PurchaseForm
          purchase={editingPurchase}
          onSubmit={handlePurchaseSubmit}
          onClose={() => { setShowPurchaseForm(false); setEditingPurchase(null); }}
        />
      )}

      {showBillPreview && selectedPurchase && (
        <BillPreview
          isOpen={showBillPreview}
          onClose={() => { setShowBillPreview(false); setSelectedPurchase(null); }}
          type="purchase"
          data={selectedPurchase}
          fabric={fabrics.find(f => f.id === selectedPurchase.fabric_id)}
        />
      )}
    </div>
  );
};

export default Purchase;