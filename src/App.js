import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InventoryList from './components/InventoryList';
import AddFabricForm from './components/AddFabricForm';
import Analytics from './components/Analytics';
import AIChatInterface from './components/AIChatInterface';
import Reports from './components/Reports';
import Transactions from './components/Transactions';
import CuttingOptimization from './components/CuttingOptimization';
import SearchBar from './components/SearchBar';
import ErrorBoundary from './components/ErrorBoundary';
import TransactionForm from './components/TransactionForm';
import Sales from './components/Sales';
import Purchase from './components/Purchase';
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  DocumentArrowDownIcon,
  ArrowsRightLeftIcon,
  ScissorsIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

function App() {
  const [fabrics, setFabrics] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredFabrics, setFilteredFabrics] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    color: '',
    supplier: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedFabricForTransaction, setSelectedFabricForTransaction] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchFabrics();
    fetchAnalytics();
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterFabrics();
  }, [fabrics, transactions, searchTerm, filters]);

  const fetchFabrics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fabrics');
      setFabrics(response.data);
    } catch (error) {
      console.error('Error fetching fabrics:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions');
      console.log('Fetched transactions:', response.data);
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const filterFabrics = () => {
    let filtered = fabrics;

    if (searchTerm) {
      filtered = filtered.filter(fabric => 
        fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fabric.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(fabric => 
        fabric.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.color) {
      filtered = filtered.filter(fabric => 
        fabric.color.toLowerCase().includes(filters.color.toLowerCase())
      );
    }

    if (filters.supplier) {
      filtered = filtered.filter(fabric => 
        fabric.supplier && fabric.supplier.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    // Add total_value calculation and merge transaction data to each fabric
    filtered = filtered.map(fabric => {
      // Find the most recent transaction for this fabric
      const fabricTransactions = transactions.filter(t => t.fabric_id === fabric.id);
      const latestTransaction = fabricTransactions.length > 0 
        ? fabricTransactions.reduce((latest, current) => 
            new Date(current.date) > new Date(latest.date) ? current : latest
          )
        : null;

      const result = {
        ...fabric,
        total_value: (fabric.current_quantity || fabric.quantity || 0) * (fabric.price_per_unit || 0),
        transaction_source: latestTransaction?.transaction_source || 'N/A',
        payment_mode: latestTransaction?.payment_mode || 'N/A'
      };
      
      console.log(`Fabric ID ${fabric.id}:`, {
        transactions: fabricTransactions.length,
        latestTransaction,
        result: result.transaction_source
      });
      
      return result;
    });

    setFilteredFabrics(filtered);
  };

  const handleAddFabric = async (fabricData) => {
    try {
      const formData = new FormData();
      Object.keys(fabricData).forEach(key => {
        if (key === 'image' && fabricData[key]) {
          formData.append(key, fabricData[key]);
        } else {
          formData.append(key, fabricData[key]);
        }
      });

      await axios.post('http://localhost:5000/api/fabrics', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchFabrics();
      fetchAnalytics();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding fabric:', error);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      await axios.post('http://localhost:5000/api/transactions', transactionData);
      fetchTransactions(); // Refresh transactions data
      setShowTransactionForm(false);
      setSelectedFabricForTransaction(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleUpdateFabric = async (id, fabricData) => {
    try {
      const formData = new FormData();
      Object.keys(fabricData).forEach(key => {
        if (key === 'image' && fabricData[key]) {
          formData.append(key, fabricData[key]);
        } else if (key !== 'image') {
          formData.append(key, fabricData[key]);
        }
      });

      await axios.put(`http://localhost:5000/api/fabrics/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchFabrics();
      fetchAnalytics();
      setEditingFabric(null);
    } catch (error) {
      console.error('Error updating fabric:', error);
    }
  };

  const handleDeleteFabric = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/fabrics/${id}`);
      fetchFabrics();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting fabric:', error);
    }
  };

  const handleAddTransactionClick = (fabric) => {
    setSelectedFabricForTransaction(fabric);
    setShowTransactionForm(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <ErrorBoundary>
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Textile Inventory</h2>
                <p className="text-gray-600">Manage your textile inventory with ease</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add New Fabric
                </button>
              </div>
              <SearchBar 
                fabrics={fabrics}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setFilters={setFilters}
                filters={filters}
              />
              <InventoryList 
                fabrics={filteredFabrics}
                onEdit={setEditingFabric}
                onDelete={handleDeleteFabric}
                onAddTransaction={handleAddTransactionClick}
              />
            </div>
          </ErrorBoundary>
        );
      case 'analytics':
        return (
          <ErrorBoundary>
            <Analytics analytics={analytics} />
          </ErrorBoundary>
        );
      case 'transactions':
        return (
          <ErrorBoundary>
            <Transactions />
          </ErrorBoundary>
        );
      case 'cutting':
        return (
          <ErrorBoundary>
            <CuttingOptimization />
          </ErrorBoundary>
        );
      case 'chat':
        return (
          <ErrorBoundary>
            <AIChatInterface />
          </ErrorBoundary>
        );
      case 'reports':
        return (
          <ErrorBoundary>
            <Reports />
          </ErrorBoundary>
        );
      case 'sales':
        return (
          <ErrorBoundary>
            <Sales />
          </ErrorBoundary>
        );
      case 'purchase':
        return (
          <ErrorBoundary>
            <Purchase />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 shadow-xl border-b border-orange-700">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">Evai Texile Inventory Management</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'inventory' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <Squares2X2Icon className="h-5 w-5 mr-2" />
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'analytics' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'transactions' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('cutting')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'cutting' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <ScissorsIcon className="h-5 w-5 mr-2" />
                Cutting
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'chat' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'reports' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Reports
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'sales' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Sales
              </button>
              <button
                onClick={() => setActiveTab('purchase')}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'purchase' 
                    ? 'bg-white text-orange-600 shadow-lg font-semibold' 
                    : 'text-white hover:bg-white/20 hover:shadow-md font-medium'
                }`}
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Purchase
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {(showAddForm || editingFabric) && (
        <AddFabricForm
          fabric={editingFabric}
          // 👇 ADDED THIS LINE: Passes the count so the form knows the ID
          nextId={fabrics.length + 1}
          
          onSubmit={editingFabric ? handleUpdateFabric : handleAddFabric}
          onClose={() => {
            setShowAddForm(false);
            setEditingFabric(null);
          }}
        />
      )}

      {showTransactionForm && (
        <TransactionForm
          fabric={selectedFabricForTransaction}
          onSubmit={handleAddTransaction}
          onClose={() => {
            setShowTransactionForm(false);
            setSelectedFabricForTransaction(null);
          }}
        />
      )}
    </div>
  );
}

export default App;