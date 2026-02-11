import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchableTable from './SearchableTable';
import BillPreview from './BillPreview';
import { 
  DocumentArrowDownIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // REMOVED activeTab state. Controlled solely by filters.type now.
  
  const [filters, setFilters] = useState({
    type: '', // ''=All, 'in'=StockIn, 'out'=Sales, 'purchase'=PurchaseOrders
    paymentMode: '',
    source: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsResponse, fabricsResponse, purchasesResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/transactions'),
        axios.get('http://localhost:5000/api/fabrics'),
        axios.get('http://localhost:5000/api/purchases')
      ]);
      setTransactions(transactionsResponse.data || []);
      setFabrics(fabricsResponse.data);
      setPurchases(purchasesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // --- Grouping Logic for General Transactions (Stock In / Sales) ---
  const getGroupedTransactions = () => {
    // If 'purchase' is selected, we don't show regular transactions
    if (filters.type === 'purchase') return [];

    let filtered = [...transactions];

    // Filter by Type (In/Out)
    if (filters.type) {
        filtered = filtered.filter(t => t.transaction_type === filters.type);
    }

    // Other Filters
    if (filters.paymentMode) filtered = filtered.filter(t => t.payment_mode === filters.paymentMode);
    if (filters.source) filtered = filtered.filter(t => t.transaction_source === filters.source);
    if (filters.dateFrom) filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));

    // GROUP BY REFERENCE
    const groups = filtered.reduce((acc, curr) => {
        const ref = curr.reference || `TRX-${curr.id}`; 
        
        if (!acc[ref]) {
            acc[ref] = {
                ...curr, 
                groupedIds: [curr.id],
                quantity: 0, 
                total_value: 0, 
                fabric_names: new Set(),
                items_count: 0
            };
        }
        
        acc[ref].quantity += parseFloat(curr.quantity || 0);
        acc[ref].total_value += parseFloat(curr.total_value || 0);
        acc[ref].items_count += 1;
        
        const fabricName = curr.fabric_name || (fabrics.find(f => f.id === curr.fabric_id)?.name) || 'Unknown';
        acc[ref].fabric_names.add(fabricName);
        
        return acc;
    }, {});

    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // --- Grouping Logic for Purchase Orders ---
  const getGroupedPurchases = () => {
    // Only return purchases if specifically selected
    if (filters.type !== 'purchase') return [];
    
    const groups = purchases.reduce((acc, curr) => {
        const orderNo = curr.order_number || `TRX-${curr.id}`;
        
        if (!acc[orderNo]) {
            acc[orderNo] = {
                ...curr, 
                itemsCount: 0,
                total_amount: 0,
                fabric_names: new Set(),
            };
        }
        acc[orderNo].itemsCount += 1;
        acc[orderNo].total_amount += (parseFloat(curr.total_amount) || 0);
        
        const fabric = fabrics.find(f => f.id === curr.fabric_id);
        acc[orderNo].fabric_names.add(fabric ? fabric.name : 'Unknown');
        
        return acc;
    }, {});

    const groupedList = Object.values(groups);

    // Apply Search/Status Filters locally for Purchases
    return groupedList.filter(purchase => {
      const fabricString = Array.from(purchase.fabric_names).join(' ').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        (purchase.supplier_name || '').toLowerCase().includes(search) ||
        (purchase.order_number || '').toLowerCase().includes(search) ||
        fabricString.includes(search);
      
      const matchesStatus = filterStatus === 'all' || purchase.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      paymentMode: '',
      source: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    setFilterStatus('all');
  };

  const handleViewBill = (transaction) => {
    setSelectedTransaction(transaction);
    setShowBillPreview(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- Determine Active Data ---
  const isPurchaseView = filters.type === 'purchase';
  
  const filteredTransactions = getGroupedTransactions(); 
  const filteredPurchases = getGroupedPurchases();
  
  const currentData = isPurchaseView ? filteredPurchases : filteredTransactions;

  // --- CSV Export ---
  const exportToCSV = () => {
    const dataToExport = currentData;
    const headers = ['Order/Ref', 'Source', 'Type', 'Total Amount', 'Date'];
    const rows = dataToExport.map(row => [
        row.order_number || row.reference,
        row.transaction_source || row.supplier_name,
        row.transaction_type || 'purchase',
        row.total_amount || row.total_value,
        row.date || row.order_date
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const getUniqueValues = (field) => {
    return [...new Set(transactions.map(t => t[field]).filter(Boolean))].sort();
  };

  const uniquePaymentModes = getUniqueValues('payment_mode');
  const uniqueSources = getUniqueValues('transaction_source');

  // Columns for Standard Transactions
  const columns = [
    {
      key: 'fabric_name',
      label: 'Fabrics', 
      sortable: true,
      formatter: (value, row) => {
        const names = row.fabric_names ? Array.from(row.fabric_names) : [row.fabric_name];
        return (
            <div className="flex flex-col gap-1">
                {names.map((name, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded w-fit">{name}</span>
                ))}
            </div>
        );
      }
    },
    {
      key: 'transaction_type',
      label: 'Type',
      sortable: true,
      formatter: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === 'in' ? 'Stock In' : 'Sale'}
        </span>
      )
    },
    {
      key: 'quantity',
      label: 'Total Qty',
      sortable: true,
      formatter: (value, row) => {
        const fabric = fabrics.find(f => f.id === row.fabric_id);
        return `${row.quantity} ${fabric ? fabric.unit : 'units'}`;
      }
    },
    {
      key: 'total_value',
      label: 'Total Value',
      sortable: true,
      type: 'currency',
      formatter: (value, row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.total_value)}</span>
      )
    },
    {
      key: 'payment_mode',
      label: 'Payment Mode',
      sortable: true,
      formatter: (value) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'transaction_source',
      label: 'Source',
      sortable: true,
      formatter: (value) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'reference',
      label: 'Ref #',
      sortable: true
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      type: 'date'
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      formatter: (value, row) => (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handleViewBill(row)}
            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
            title="View Bill"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <p className="text-gray-600 mt-1">
              View and manage all inventory transactions with detailed information
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Unified Filters Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {(filters.type || filters.paymentMode || filters.source || filters.dateFrom || filters.dateTo || searchTerm) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* 1. Master Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                    setFilters(prev => ({ ...prev, type: e.target.value }));
                    setSearchTerm(''); // Clear search on switch for clarity
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">All Transactions (In & Out)</option>
                <option value="in">Stock In</option>
                <option value="out">Sales</option>
                <option value="purchase">Purchase Orders</option>
              </select>
            </div>

            {/* 2. Secondary Filters (Conditional based on view) */}
            {isPurchaseView ? (
                 <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search by supplier, order #, or fabric..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="ordered">Ordered</option>
                            <option value="pending">Pending</option>
                            <option value="received">Received</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                 </div>
            ) : (
                <>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                        value={filters.paymentMode}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Payment Modes</option>
                        {uniquePaymentModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                        ))}
                    </select>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <select
                        value={filters.source}
                        onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Sources</option>
                        {uniqueSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                        ))}
                    </select>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    </div>
                </>
            )}
          </div>

          {/* Active Filter Badges */}
          {!isPurchaseView && (filters.type || filters.paymentMode || filters.source || filters.dateFrom || filters.dateTo) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Type: {filters.type === 'in' ? 'Stock In' : 'Sales'}
                </span>
              )}
              {filters.paymentMode && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Payment: {filters.paymentMode}
                </span>
              )}
              {filters.source && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Source: {filters.source}
                </span>
              )}
              {filters.dateFrom && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  From: {formatDate(filters.dateFrom)}
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  To: {formatDate(filters.dateTo)}
                </span>
              )}
            </div>
          )}
      </div>

      {/* Summary Stats - Dynamic based on active view */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">
            {isPurchaseView ? 'Total Orders' : 'Total Transactions'}
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{currentData.length}</div>
        </div>
        
        {/* Conditional Stats */}
        {!isPurchaseView ? (
            <>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm font-medium text-gray-500">Stock Added</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">
                    {filteredTransactions.filter(t => t.transaction_type === 'in').length}
                    </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm font-medium text-gray-500">Sales Count</div>
                    <div className="mt-2 text-3xl font-bold text-red-600">
                    {filteredTransactions.filter(t => t.transaction_type === 'out').length}
                    </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                    <div className="mt-2 text-3xl font-bold text-blue-600">
                    {formatCurrency(filteredTransactions
                        .filter(t => t.transaction_type === 'out')
                        .reduce((sum, t) => sum + (t.total_value || 0), 0))}
                    </div>
                </div>
            </>
        ) : (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500">Total Purchase Value</div>
                <div className="mt-2 text-3xl font-bold text-purple-600">
                    {formatCurrency(filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0))}
                </div>
            </div>
        )}
      </div>

      {/* VIEW SWITCHER: Table Render */}
      {isPurchaseView ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fabric</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((purchase) => (
                  <tr key={purchase.order_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.order_number || `TRX-${purchase.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                            {Array.from(purchase.fabric_names).map((name, i) => (
                                <span key={i} className="text-xs bg-gray-100 rounded px-2 py-1 w-fit">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.itemsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {formatCurrency(purchase.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBill(purchase)}
                          className="text-green-600 hover:text-green-900"
                          title="View Bill"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No purchases found matching criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <SearchableTable
            data={currentData}
            columns={columns}
            searchPlaceholder="Search transactions..."
          />
        </div>
      )}

      {/* Bill Preview Modal */}
      {showBillPreview && selectedTransaction && (
        <BillPreview
          isOpen={showBillPreview}
          onClose={() => {
            setShowBillPreview(false);
            setSelectedTransaction(null);
          }}
          type={selectedTransaction.transaction_type === 'in' ? 'purchase' : 'sale'}
          data={{
            ...selectedTransaction,
            customer_name: selectedTransaction.transaction_type === 'out' ? (selectedTransaction.customer_name || 'Walk-in Customer') : undefined,
            supplier_name: selectedTransaction.transaction_type === 'in' ? (selectedTransaction.supplier_name || 'Various Suppliers') : undefined,
            sale_date: selectedTransaction.date,
            order_date: selectedTransaction.date,
            total_amount: selectedTransaction.total_value || selectedTransaction.total_amount, // Handle both
            unit: 'units', 
            payment_mode: selectedTransaction.payment_mode,
            invoice_number: selectedTransaction.reference || selectedTransaction.order_number || `TRX-${selectedTransaction.id}`
          }}
          fabric={fabrics.find(f => f.id === selectedTransaction.fabric_id)}
        />
      )}
    </div>
  );
};

export default Transactions;