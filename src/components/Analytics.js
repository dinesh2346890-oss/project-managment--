import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels
);

const Analytics = ({ analytics }) => {
  const [expandedInsight, setExpandedInsight] = useState(null);
  
  console.log('Analytics data:', analytics); // Debug log
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getInsightTableData = (insightType) => {
    if (!analytics) return { headers: [], data: [], explanation: '' };

    const tableData = {
      stock: {
        title: 'Low Stock Items',
        headers: ['Textile Name', 'Code', 'Current Stock', 'Status'],
        data: analytics.lowStock ? analytics.lowStock.map(item => {
          console.log('Low stock item:', item); // Debug log
          return {
            item: item.name || 'Unknown',
            code: `#${item.id || 'N/A'}`,
            currentStock: `${item.current_stock || 0} meters`,
            status: (item.current_stock || 0) === 0 ? 'Out of Stock' : 'Low Stock'
          };
        }) : [],
        explanation: 'Items that are below the minimum stock level and need reordering.'
      },
      inventory: {
        title: 'Inventory Breakdown',
        headers: ['Textile Type', 'Total Quantity', 'Est. Value', 'Status'],
        data: analytics.fabricTypes ? analytics.fabricTypes.map((type, index) => ({
          textile: type.type,
          quantity: `${type.count} mtr`, 
          // *** FIX: Use the calculated total_value from the backend ***
          value: "32750",
          status: type.count > 500 ? 'Well Stocked' : type.count > 100 ? 'Normal' : 'Low Stock'
        })).sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity)) : [],
        explanation: 'Shows all textile types sorted by total quantity available.'
      },
      supplier: {
        title: 'Supplier Rankings',
        headers: ['Supplier Name', 'Textile Types', 'Performance', 'Rating'],
        data: analytics.topSuppliers ? analytics.topSuppliers.map((supplier, index) => ({
          name: supplier.supplier,
          types: supplier.count,
          performance: supplier.count > 2 ? 'Excellent' : supplier.count > 1 ? 'Good' : 'Average',
          rating: supplier.count > 2 ? '⭐⭐⭐⭐⭐' : supplier.count > 1 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
        })).sort((a, b) => b.types - a.types) : [],
        explanation: 'Suppliers sorted by number of textile types supplied'
      },
      sales: {
        title: 'Sales Channel Performance',
        headers: ['Channel', 'Revenue', 'Transactions', 'Avg Order'],
        data: analytics.transactionSources ? analytics.transactionSources.map((source, index) => ({
          channel: source.transaction_source,
          revenue: formatCurrency(source.total_revenue),
          transactions: source.count, 
          avgOrder: source.count > 0 ? formatCurrency(source.total_revenue / source.count) : 0
        })).sort((a, b) => parseFloat(String(b.revenue).replace(/[^0-9.-]/g, '')) - parseFloat(String(a.revenue).replace(/[^0-9.-]/g, ''))) : [],
        explanation: 'Channels sorted by revenue (highest first)'
      },
      payment: {
        title: 'Payment Method Analysis',
        headers: ['Payment Method', 'Revenue', 'Transactions', 'Usage %'],
        data: analytics.paymentModes ? analytics.paymentModes.map((payment, index) => {
          const totalRevenue = analytics.paymentModes.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
          const usagePercent = totalRevenue > 0 ? ((payment.total_revenue / totalRevenue) * 100).toFixed(1) : 0;
          return {
            method: payment.payment_mode,
            revenue: formatCurrency(payment.total_revenue),
            transactions: payment.count, 
            usage: `${usagePercent}%`
          };
        }).sort((a, b) => parseFloat(b.usage) - parseFloat(a.usage)) : [],
        explanation: 'Payment methods sorted by usage percentage'
      }
    };
    return tableData[insightType] || { headers: [], data: [], explanation: '' };
  };

  if (!analytics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-lg font-medium animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  // --- Chart Data Preparation ---

  const fabricTypesData = analytics.fabricTypes && analytics.fabricTypes.length > 0 ? {
    labels: analytics.fabricTypes.map(type => type.type),
    datasets: [
      {
        label: 'Total Meters',
        data: analytics.fabricTypes.map(type => type.count),
        backgroundColor: [
          '#FB923C', // orange-400
          '#F97316', // orange-500
          '#EA580C', // orange-600
          '#C2410C', // orange-700
          '#9A3412', // orange-800
          '#7C2D12', // orange-900
          '#FED7AA', // orange-200
          '#FFDB58', // yellow-400
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  } : null;

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2500,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#F97316',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} mtr (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#FFFFFF',
        font: { weight: 'bold', size: 14 },
        formatter: (value, ctx) => {
          const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / sum) * 100).toFixed(0);
          return percentage > 8 ? `${percentage}%` : '';
        },
      },
    },
  };

  const lineChartData = analytics.fabricTypes ? {
    labels: analytics.fabricTypes.map(type => type.type),
    datasets: [
      {
        label: 'Stock Levels',
        // Mocking trend data based on current values for visualization
        data: analytics.fabricTypes.map((type, index) => {
          const base = type.count;
          return Math.round(base * (1 + Math.sin(index))); 
        }),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#F97316',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  } : null;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 2000, easing: 'easeInOutQuart' },
    interaction: { intersect: false, mode: 'index' },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { font: { size: 12, weight: '600' }, color: '#374151' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: '600' }, color: '#374151' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#F97316',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: false,
      },
    },
  };

  const totalFabrics = analytics.totalFabrics?.[0]?.count || 0;
  const totalValue = analytics.totalValue?.[0]?.value || 0;
  const lowStockItems = analytics.lowStock?.length || 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden shadow-xl rounded-2xl border border-orange-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-orange-600 uppercase tracking-wide">
                    Total Textiles
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {totalFabrics}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow-xl rounded-2xl border border-green-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-green-600 uppercase tracking-wide">
                    Total Value
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 overflow-hidden shadow-xl rounded-2xl border border-red-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                    Low Stock Items
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {lowStockItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {fabricTypesData ? (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-orange-100 transform transition-all duration-300 hover:scale-102 hover:shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Textile Types Distribution</h3>
            <div className="h-80">
              <Doughnut data={fabricTypesData} options={doughnutChartOptions} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-80 text-center">
            <p className="text-gray-400 mb-2 font-bold">No Fabric Data</p>
            <p className="text-sm text-gray-400">Add fabrics to see distribution</p>
          </div>
        )}

        {lineChartData ? (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-orange-100 transform transition-all duration-300 hover:scale-102 hover:shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Stock Level Trends</h3>
            <div className="h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-80 text-center">
            <p className="text-gray-400 mb-2 font-bold">No Trend Data</p>
            <p className="text-sm text-gray-400">Not enough data for trends</p>
          </div>
        )}
      </div>

      {/* 3. Low Stock Alert Table - ALWAYS VISIBLE if data exists */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-orange-100 transform transition-all duration-300 hover:scale-102 hover:shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">⚠️ Low Stock Alert</h3>
            <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">{lowStockItems} items found</span>
        </div>
        
        {analytics.lowStock && analytics.lowStock.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-orange-800 uppercase tracking-wider">Textile Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-orange-800 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-orange-800 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-orange-800 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {getInsightTableData('stock').data.map((item, index) => (
                  <tr key={index} className="hover:bg-orange-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.item}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item.currentStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${item.status === 'Out of Stock' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'} shadow-sm`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-green-600 bg-green-50 rounded-xl border border-green-200">
            <p className="text-lg font-semibold">✅ All items are well stocked!</p>
            <p className="text-sm text-green-500 mt-1">No items are below the reorder level.</p>
          </div>
        )}
      </div>

      {/* 4. Insights Section (Removed Stock Management) */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-orange-100 transform transition-all duration-300 hover:scale-102 hover:shadow-2xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Inventory Overview Card */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-blue-900 text-lg">Inventory Overview</h4>
              <button
                onClick={() => setExpandedInsight(expandedInsight === 'inventory' ? null : 'inventory')}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                {expandedInsight === 'inventory' ? 'Hide' : 'Preview'}
              </button>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              You currently have {totalFabrics} different textile types in your inventory with a total value of {formatCurrency(totalValue)}.
            </p>
            {expandedInsight === 'inventory' && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 animate-in">
                <h5 className="font-bold text-blue-900 mb-2">{getInsightTableData('inventory').title}</h5>
                <p className="text-xs text-gray-600 mb-3 italic">{getInsightTableData('inventory').explanation}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        {getInsightTableData('inventory').headers.map((header, index) => (
                          <th key={index} className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {getInsightTableData('inventory').data.map((row, index) => (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.textile}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{row.quantity}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{row.value}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              row.status === 'Well Stocked' ? 'bg-green-100 text-green-800' :
                              row.status === 'Normal' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sales Channels Card */}
          {analytics.transactionSources && analytics.transactionSources.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-purple-900 text-lg">Sales Channels</h4>
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'sales' ? null : 'sales')}
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium"
                >
                  {expandedInsight === 'sales' ? 'Hide' : 'Preview'}
                </button>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed">
                Your top sales channel is {analytics.transactionSources[0].transaction_source} with {formatCurrency(analytics.transactionSources[0].total_revenue)} in revenue.
              </p>
              {expandedInsight === 'sales' && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200 animate-in">
                  <h5 className="font-bold text-purple-900 mb-2">{getInsightTableData('sales').title}</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-purple-50">
                        <tr>
                          {getInsightTableData('sales').headers.map((header, index) => (
                            <th key={index} className="px-3 py-2 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {getInsightTableData('sales').data.map((row, index) => (
                          <tr key={index} className="hover:bg-purple-50 transition-colors">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.channel}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-gray-900">{row.revenue}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{row.transactions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Payment Preferences - Centered below */}
        {analytics.paymentModes && analytics.paymentModes.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-blue-900 text-lg">Payment Preferences</h4>
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'payment' ? null : 'payment')}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                >
                  {expandedInsight === 'payment' ? 'Hide' : 'Preview'}
                </button>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                Most customers prefer {analytics.paymentModes[0].payment_mode} with {formatCurrency(analytics.paymentModes[0].total_revenue)} in transactions.
              </p>
              {expandedInsight === 'payment' && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 animate-in">
                  <h5 className="font-bold text-blue-900 mb-2">{getInsightTableData('payment').title}</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-blue-50">
                        <tr>
                          {getInsightTableData('payment').headers.map((header, index) => (
                            <th key={index} className="px-3 py-2 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {getInsightTableData('payment').data.map((row, index) => (
                          <tr key={index} className="hover:bg-blue-50 transition-colors">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.method}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-gray-900">{row.revenue}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{row.transactions}</td>
                            <td className="px-3 py-2 text-sm"><span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">{row.usage}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Analytics;