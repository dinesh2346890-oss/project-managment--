import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, CurrencyDollarIcon, CalendarIcon, UserIcon, TruckIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import SalesForm from './SalesForm';
import BillPreview from './BillPreview';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
    fetchFabrics();
    fetchTransactions();
  }, []);

  // --- Helper to Group Items by Invoice Number ---
  const groupSalesByInvoice = (flatData) => {
    const grouped = {};

    flatData.forEach(record => {
      const key = record.invoice_number || `TRX-${record.id}`; 

      if (!grouped[key]) {
        grouped[key] = {
          ...record, 
          items: [record], // Store ALL items here
          display_fabrics: [record.fabric_name], 
          total_qty_aggregated: parseFloat(record.quantity || 0),
          total_amt_aggregated: parseFloat(record.total_amount || 0)
        };
      } else {
        grouped[key].items.push(record);
        grouped[key].display_fabrics.push(record.fabric_name);
        grouped[key].total_qty_aggregated += parseFloat(record.quantity || 0);
        grouped[key].total_amt_aggregated += parseFloat(record.total_amount || 0);
      }
    });

    return Object.values(grouped).map(group => ({
      ...group,
      formatted_fabric_names: [...new Set(group.display_fabrics)].join(', ') 
    })).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
  };

  const fetchSales = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sales');
      const groupedData = groupSalesByInvoice(response.data || []);
      setSales(groupedData);
    } catch (error) {
      console.error('Error fetching sales:', error);
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

  const handleAddSale = () => {
    setEditingSale(null);
    setShowSalesForm(true);
  };

  // --- FIXED: Pass the whole grouped object ---
  const handleEditSale = (sale) => {
    setEditingSale(sale); // 'sale' here is now the Grouped Object containing .items array
    setShowSalesForm(true);
  };

  const handleViewBill = (sale) => {
    setSelectedSale(sale);
    setShowBillPreview(true);
  };

  const handleDeleteSale = async (invoice_number) => {
    if (window.confirm('Are you sure you want to delete this entire invoice?')) {
      try {
        console.log("Delete logic needs backend support for bulk delete by invoice");
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const handleSalesSubmit = async (saleData) => {
    fetchSales();
    fetchTransactions();
    setShowSalesForm(false);
    setEditingSale(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      (sale.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sale.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sale.formatted_fabric_names?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredSales
    .filter(sale => sale.status === 'completed')
    .reduce((sum, sale) => sum + (sale.total_amt_aggregated || 0), 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Management</h2>
          <p className="text-gray-600 mt-1">Manage your fabric sales and orders</p>
        </div>
        <button
          onClick={handleAddSale}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Sale
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TruckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {sales.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {sales.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(sales.map(s => s.customer_name)).size}
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
            placeholder="Search by customer, invoice, or fabric..."
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.invoice_number || sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.invoice_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={sale.formatted_fabric_names}>{sale.formatted_fabric_names}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.total_qty_aggregated}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(sale.total_amt_aggregated)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sale.status)}`}>{sale.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button onClick={() => handleViewBill(sale)} className="text-green-600 hover:text-green-900" title="View Bill"><EyeIcon className="h-5 w-5" /></button>
                      <button onClick={() => handleEditSale(sale)} className="text-blue-600 hover:text-blue-900" title="Edit"><PencilSquareIcon className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteSale(sale.invoice_number)} className="text-red-600 hover:text-red-900" title="Delete"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-gray-500">No sales found</div>
          )}
        </div>
      </div>

      {showSalesForm && (
        <SalesForm
          sale={editingSale}
          onSubmit={handleSalesSubmit}
          onClose={() => {
            setShowSalesForm(false);
            setEditingSale(null);
          }}
        />
      )}

      {showBillPreview && selectedSale && (
        <BillPreview
          isOpen={showBillPreview}
          onClose={() => {
            setShowBillPreview(false);
            setSelectedSale(null);
          }}
          type="sale"
          data={selectedSale}
        />
      )}
    </div>
  );
};

export default Sales;