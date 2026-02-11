import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const [fabrics, setFabrics] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportType, setReportType] = useState('inventory'); 
  const [filters, setFilters] = useState({
    type: '',
    supplier: '',
    source: '', // NEW: Source Filter
    status: 'all'
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fabricsResponse, transactionsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/fabrics'),
        axios.get('http://localhost:5000/api/transactions')
      ]);
      setFabrics(fabricsResponse.data);
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // --- Filter Logic for Inventory ---
  const getFilteredData = () => {
    let filteredFabrics = [...fabrics];

    if (filters.type) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.supplier) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.supplier && f.supplier.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filteredFabrics = filteredFabrics.filter(f => {
        const currentQuantity = f.current_quantity || f.quantity;
        if (filters.status === 'low') return currentQuantity <= 20;
        if (filters.status === 'good') return currentQuantity > 20;
        return true;
      });
    }

    return filteredFabrics;
  };

  // --- Filter Logic for Transactions (Sales/Purchase) ---
  const getFilteredTransactions = (type) => {
    let filtered = [...transactions];

    // Filter by Type
    if (type === 'sales') {
        filtered = filtered.filter(t => t.transaction_type === 'out');
    } else if (type === 'purchase') {
        filtered = filtered.filter(t => t.transaction_type === 'in');
    }

    // Filter by Source (NEW)
    if (filters.source) {
        filtered = filtered.filter(t => 
            t.transaction_source && t.transaction_source.toLowerCase().includes(filters.source.toLowerCase())
        );
    }

    // Filter by Date Range
    if (dateRange.startDate) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(dateRange.startDate));
    }
    if (dateRange.endDate) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(dateRange.endDate));
    }

    return filtered;
  };

  // --- Export Logic ---
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
        alert("No data to export!");
        return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const dateStr = new Date().toISOString().split('T')[0];

    if (reportType === 'inventory') {
        const data = getFilteredData().map(fabric => ({
            'Fabric Name': fabric.name,
            'Type': fabric.type,
            'Color': fabric.color || 'N/A',
            'Current Stock': fabric.current_quantity || fabric.quantity,
            'Unit': fabric.unit,
            'Price': fabric.price_per_unit,
            'Total Value': (fabric.current_quantity || fabric.quantity) * fabric.price_per_unit,
            'Supplier': fabric.supplier || 'N/A'
        }));
        exportToCSV(data, `In_Stock_Report_${dateStr}.csv`);

    } else if (reportType === 'sales') {
        const data = getFilteredTransactions('sales').map(t => {
            const fabric = fabrics.find(f => f.id === t.fabric_id);
            return {
                'Date': formatDate(t.date),
                'Invoice Ref': t.reference || 'N/A',
                'Fabric': fabric ? fabric.name : 'Unknown',
                'Quantity Sold': t.quantity,
                'Unit Price': t.unit_price,
                'Total Revenue': t.total_value,
                'Source': t.transaction_source || 'N/A', // Included Source in CSV
                'Payment Mode': t.payment_mode || 'N/A'
            };
        });
        exportToCSV(data, `Sales_Report_${dateStr}.csv`);

    } else if (reportType === 'purchase') {
        const data = getFilteredTransactions('purchase').map(t => {
            const fabric = fabrics.find(f => f.id === t.fabric_id);
            return {
                'Date': formatDate(t.date),
                'PO Ref': t.reference || 'N/A',
                'Fabric': fabric ? fabric.name : 'Unknown',
                'Quantity Purchased': t.quantity,
                'Unit Cost': t.unit_price,
                'Total Cost': t.total_value,
                'Source': t.transaction_source || 'N/A', // Included Source in CSV
                'Supplier': fabric ? fabric.supplier : 'N/A'
            };
        });
        exportToCSV(data, `Purchase_Report_${dateStr}.csv`);
    }
  };

  const getUniqueValues = (data, field) => {
    return [...new Set(data.map(item => item[field]).filter(Boolean))].sort();
  };

  const uniqueTypes = getUniqueValues(fabrics, 'type');
  const uniqueSuppliers = getUniqueValues(fabrics, 'supplier');
  // Get unique sources from transactions for the filter dropdown
  const uniqueSources = getUniqueValues(transactions, 'transaction_source');

  const previewData = reportType === 'inventory' 
    ? getFilteredData() 
    : getFilteredTransactions(reportType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      
      {/* Header */}
      <div className="bg-white shadow-xl rounded-2xl p-8 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reports Center</h2>
            <p className="text-gray-600 text-lg">
              Generate and download Sales, Purchase, and Stock reports.
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <DocumentArrowDownIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white shadow-xl rounded-2xl p-8 mb-6 border border-gray-100">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="w-full md:w-1/3">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Report Type</label>
                <select
                    value={reportType}
                    onChange={(e) => {
                        setReportType(e.target.value);
                        setFilters({ type: '', supplier: '', source: '', status: 'all' }); // Reset filters on switch
                    }}
                    className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-gray-700 bg-blue-50/50"
                >
                    <option value="inventory">In Stock Report</option>
                    <option value="sales">Sales Report</option>
                    <option value="purchase">Purchase Report</option>
                </select>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
                <button
                    onClick={() => {
                        setFilters({ type: '', supplier: '', source: '', status: 'all' });
                        setDateRange({ startDate: '', endDate: '' });
                    }}
                    className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Reset
                </button>
                
                <button
                    onClick={handleDownloadReport}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-bold"
                >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Download {reportType === 'inventory' ? 'Stock' : reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </button>
            </div>
        </div>
        
        {/* Filters Section */}
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Filter Criteria</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* 1. Date Range (Sales/Purchase Only) */}
                {reportType !== 'inventory' && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </>
                )}

                {/* 2. Source Filter (Sales/Purchase Only) */}
                {reportType !== 'inventory' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Source</label>
                        <select
                            value={filters.source}
                            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">All Sources</option>
                            {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                )}

                {/* 3. Inventory Specific Filters */}
                {reportType === 'inventory' && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Fabric Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">All Types</option>
                                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label>
                            <select
                                value={filters.supplier}
                                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">All Suppliers</option>
                                {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="all">All Items</option>
                                <option value="low">Low Stock (&lt;20)</option>
                                <option value="good">Good Stock (&gt;20)</option>
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 overflow-hidden">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
            Preview: {reportType === 'inventory' ? 'In Stock Inventory' : reportType === 'sales' ? 'Sales History' : 'Purchase History'}
        </h3>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {reportType === 'inventory' ? (
                            <>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fabric Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Current Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Value</th>
                            </>
                        ) : (
                            <>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fabric</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total Amount</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 10).map((row, index) => {
                         // Resolve Fabric Name for transactions
                         const fabricName = reportType === 'inventory' 
                            ? row.name 
                            : (fabrics.find(f => f.id === row.fabric_id)?.name || 'Unknown');

                         return (
                            <tr key={index} className="hover:bg-gray-50">
                                {reportType === 'inventory' ? (
                                    <>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{fabricName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.type}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.current_quantity || row.quantity} {row.unit}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {formatCurrency((row.current_quantity || row.quantity) * row.price_per_unit)}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(row.date)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                {row.transaction_source || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{fabricName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.quantity}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(row.total_value)}</td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {previewData.length > 10 && (
                <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
                    Showing first 10 rows. Download report to see all {previewData.length} records.
                </div>
            )}
            {previewData.length === 0 && (
                <div className="text-center py-8 text-gray-400">No data found matching your filters.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reports;