import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ScissorsIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CuttingOptimization = () => {
  const [fabrics, setFabrics] = useState([]);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    fetchFabrics();
  }, []);

  const fetchFabrics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setFabrics(response.data);
    } catch (error) {
      console.error('Error fetching fabrics:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/cutting-reports');
      setReports(response.data);
      setShowReports(true);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOptimization = async () => {
    if (!selectedFabric || !quantity) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/cutting-optimization/${selectedFabric}/${quantity}`);
      setOptimization(response.data);
    } catch (error) {
      console.error('Error calculating optimization:', error);
      alert(error.response?.data?.error || 'Error calculating optimization');
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

  const filteredFabrics = fabrics.filter(fabric =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fabric.color && fabric.color.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportReports = () => {
    const reportData = reports.flatMap(report => 
      report.cuttingReports
        .filter(cutting => cutting.possible)
        .map(cutting => ({
          'Fabric Name': report.fabricName,
          'Fabric Type': report.fabricType,
          'Color': report.color || 'N/A',
          'Current Stock': `${report.currentStock} meters`,
          'Price per Meter': formatCurrency(report.pricePerMeter),
          'Bulk Quantity': `${cutting.bulkQuantity} meters`,
          '10m Pieces': cutting.pieces['10m'] || 0,
          '5m Pieces': cutting.pieces['5m'] || 0,
          '3m Pieces': cutting.pieces['3m'] || 0,
          '1m Pieces': cutting.pieces['1m'] || 0,
          'Total Pieces': Object.values(cutting.pieces).reduce((sum, count) => sum + count, 0),
          'Total Value': formatCurrency(cutting.totalValue),
          'Waste': `${cutting.waste} meters`,
          'Efficiency': `${cutting.efficiency}%`
        }))
    );

    const headers = Object.keys(reportData[0] || {}).join(',');
    const rows = reportData.map(item => Object.values(item).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutting_optimization_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ScissorsIcon className="h-8 w-8 mr-3 text-blue-600" />
              Cutting Optimization
            </h2>
            <p className="text-gray-600 mt-1">
              Optimize fabric cutting for bulk quantities and maximize piece utilization
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchReports}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <CalculatorIcon className="h-5 w-5 mr-2" />
              Generate Reports
            </button>
            {showReports && (
              <button
                onClick={exportReports}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calculator Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cutting Calculator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Fabric Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Fabric</label>
            <select
              value={selectedFabric || ''}
              onChange={(e) => setSelectedFabric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a fabric...</option>
              {filteredFabrics.map(fabric => (
                <option key={fabric.id} value={fabric.id}>
                  {fabric.name} ({fabric.type}) - {fabric.stock}m available
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (meters)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Quantity Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
            <div className="flex space-x-2">
              {[50, 100, 150, 200].map(qty => (
                <button
                  key={qty}
                  onClick={() => setQuantity(qty)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                >
                  {qty}m
                </button>
              ))}
            </div>
          </div>

          {/* Calculate Button */}
          <div className="flex items-end">
            <button
              onClick={calculateOptimization}
              disabled={!selectedFabric || !quantity || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search fabrics by name, type, or color..."
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optimization Results */}
      {optimization && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Fabric</div>
              <div className="mt-1 text-lg font-bold text-blue-900">{optimization.fabric.name}</div>
              <div className="text-sm text-blue-700">{optimization.fabric.type} • {optimization.fabric.color}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">Requested Quantity</div>
              <div className="mt-1 text-lg font-bold text-green-900">{optimization.requestedQuantity} meters</div>
              <div className="text-sm text-green-700">Available: {optimization.fabric.currentStock} meters</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Total Value</div>
              <div className="mt-1 text-lg font-bold text-purple-900">{formatCurrency(optimization.totalValue)}</div>
              <div className="text-sm text-purple-700">@ {formatCurrency(optimization.fabric.pricePerMeter)}/meter</div>
            </div>
          </div>

          <div className="space-y-4">
            {optimization.combinations.map((combo, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">{combo.name}</h4>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Efficiency: {combo.efficiency}%</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      combo.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                      combo.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {combo.efficiency >= 90 ? 'Excellent' : combo.efficiency >= 80 ? 'Good' : 'Fair'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(combo.pieces).map(([size, count]) => (
                    <div key={size} className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">{size} pieces</div>
                      <div className="text-xs text-gray-500">{formatCurrency(parseInt(size) * count * optimization.fabric.pricePerMeter)}</div>
                    </div>
                  ))}
                </div>
                
                {combo.waste > 0 && (
                  <div className="mt-3 text-sm text-orange-600">
                    Waste: {combo.waste} meters ({formatCurrency(combo.waste * optimization.fabric.pricePerMeter)})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {showReports && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bulk Cutting Reports</h3>
            <button
              onClick={exportReports}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export All Reports
            </button>
          </div>

          <div className="space-y-6">
            {reports.map((report) => (
              <div key={report.fabricId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{report.fabricName}</h4>
                    <p className="text-sm text-gray-600">{report.fabricType} • {report.color} • Stock: {report.currentStock}m</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Price per meter</div>
                    <div className="font-bold text-gray-900">{formatCurrency(report.pricePerMeter)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {report.cuttingReports.map((cutting) => (
                    <div 
                      key={cutting.bulkQuantity} 
                      className={`p-3 rounded-lg border ${
                        cutting.possible 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`font-bold ${
                          cutting.possible ? 'text-green-700' : 'text-gray-400'
                        }`}>
                          {cutting.bulkQuantity}m
                        </div>
                        {cutting.possible ? (
                          <>
                            <div className="text-xs text-gray-600 mt-1">
                              {cutting.pieces['10m'] || 0}×10m
                            </div>
                            <div className="text-xs text-gray-600">
                              {cutting.pieces['5m'] || 0}×5m
                            </div>
                            <div className="text-xs text-gray-600">
                              {cutting.pieces['3m'] || 0}×3m
                            </div>
                            <div className="text-xs text-gray-600">
                              {cutting.pieces['1m'] || 0}×1m
                            </div>
                            <div className="text-xs text-green-600 font-medium mt-1">
                              {cutting.efficiency}% eff.
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400">Insufficient stock</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingOptimization;
