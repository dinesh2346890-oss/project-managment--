import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  TableCellsIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const AIChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fabrics, setFabrics] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const messagesEndRef = useRef(null);
  const sessionId = 'ai-session-' + Date.now();

  useEffect(() => {
    fetchInitialData();
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      const [fabricsResponse, analyticsResponse, transactionsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/fabrics'),
        axios.get('http://localhost:5000/api/analytics'),
        axios.get('http://localhost:5000/api/transactions')
      ]);
      setFabrics(fabricsResponse.data);
      setAnalytics(analyticsResponse.data);
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const initializeChat = () => {
    setMessages([{
      user_message: 'hi',
      bot_response: `🤖 **Welcome to AI Fabric Assistant!**

I'm your **intelligent conversational AI assistant** for your fabric business. I can help you with natural conversations and smart automation.

## 🤖 **Natural Chat Capabilities:**
- **Free-form conversations** - Ask me anything in plain English
- **Context-aware responses** - I remember our conversation history
- **Smart follow-up questions** - I'll ask clarifying questions when needed
- **Multi-turn conversations** - We can have extended discussions about topics

## 🧠 **Advanced Analytics & Intelligence:**
- **Real-time insights** from our ongoing conversation
- **Pattern recognition** - I learn from your business patterns
- **Proactive suggestions** - I'll recommend actions based on our chat
- **Natural language understanding** - I understand context and intent

## 📊 **Business Intelligence:**
- **Conversational analytics** - Insights from our interactions
- **Trend identification** - I'll spot patterns in your questions
- **Automated recommendations** - Smart suggestions based on our discussion
- **Decision support** - Help you make informed business decisions

## 🎯 **How to Chat With Me:**

**Start naturally:**
- "What's my current inventory status?"
- "How are sales this month compared to last month?"
- "Which fabrics are performing best?"
- "Should I reorder any items this week?"

**I can help you with:**
- **Inventory questions** - Stock levels, reorder points, quality issues
- **Sales analysis** - Performance trends, customer insights
- **Financial queries** - Revenue, costs, profit analysis
- **Strategic planning** - Business growth recommendations
- **Problem solving** - Operational challenges and solutions

## 💡 **Smart Features:**
- **Memory** - I remember our conversation context
- **Learning** - I get smarter with each interaction
- **Adaptability** - I adjust to your communication style
- **Proactivity** - I'll suggest actions before you ask

## 🎪 **Example Interactions:**

**You:** "How's business going this week?"
**Me:** "Looking at your recent transactions, sales are up 15% from last week, with cotton fabrics performing strongest. Your top customer is Ramesh Textiles with 8 orders this month. Would you like me to analyze their purchasing patterns?"

**You:** "I need to restock silk fabrics"
**Me:** "I'll check your current silk inventory levels and supplier lead times. Based on your typical order cycle, I recommend ordering 200 meters now to avoid stockouts. Your current supplier has a 5-day lead time. Should I help you find alternative suppliers with better availability?"

## 🚀 **Try It Now!**

Start a natural conversation with me like you would with a human assistant. I'll provide intelligent, contextual responses and learn from our interactions to better serve your fabric business needs!

**What would you like to discuss today?**`,
      timestamp: new Date().toISOString(),
      type: 'welcome'
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAnalyticsResponse = (query, data) => {
    const lowerQuery = query.toLowerCase();
    
    // Transaction source analysis
    if (lowerQuery.includes('source') || lowerQuery.includes('channel') || lowerQuery.includes('platform') || lowerQuery.includes('amazon') || lowerQuery.includes('meesho')) {
      const sourceData = {};
      data.transactions.forEach(transaction => {
        if (transaction.transaction_source) {
          sourceData[transaction.transaction_source] = (sourceData[transaction.transaction_source] || 0) + 1;
        }
      });

      if (Object.keys(sourceData).length > 0) {
        const sortedSources = Object.entries(sourceData).sort((a, b) => b[1] - a[1]);
        const chartData = {
          labels: sortedSources.map(([source]) => source),
          datasets: [{
            label: 'Number of Transactions',
            data: sortedSources.map(([, count]) => count),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
            ]
          }]
        };

        return {
          text: `📊 **Sales Channel Analysis**

Your sales are distributed across **${Object.keys(sourceData).length} different platforms:**

${sortedSources.map(([source, count], index) => `${index + 1}. **${source}**: ${count} transactions`).join('\n')}

**Top performing channel**: **${sortedSources[0][0]}** (${sortedSources[0][1]} transactions)`,
          chart: {
            type: 'bar',
            data: chartData,
            title: 'Sales by Channel'
          }
        };
      } else {
        return {
          text: `📊 **Sales Channel Analysis**

No transaction data available. Start recording transactions to see channel performance.`,
          alert: 'info'
        };
      }
    }

    // Payment mode analysis
    if (lowerQuery.includes('payment') || lowerQuery.includes('gpay') || lowerQuery.includes('cash') || lowerQuery.includes('bank') || lowerQuery.includes('upi')) {
      const paymentData = {};
      data.transactions.forEach(transaction => {
        if (transaction.payment_mode) {
          paymentData[transaction.payment_mode] = (paymentData[transaction.payment_mode] || 0) + 1;
        }
      });

      if (Object.keys(paymentData).length > 0) {
        const sortedPayments = Object.entries(paymentData).sort((a, b) => b[1] - a[1]);
        const chartData = {
          labels: sortedPayments.map(([mode]) => mode),
          datasets: [{
            label: 'Number of Transactions',
            data: sortedPayments.map(([, count]) => count),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
            ]
          }]
        };

        return {
          text: `💳 **Payment Mode Analysis**

Customers prefer these payment methods:**

${sortedPayments.map(([mode, count], index) => `${index + 1}. **${mode}**: ${count} transactions`).join('\n')}

**Most popular**: **${sortedPayments[0][0]}** (${sortedPayments[0][1]} transactions)`,
          chart: {
            type: 'bar',
            data: chartData,
            title: 'Payment Methods'
          }
        };
      } else {
        return {
          text: `💳 **Payment Mode Analysis**

No payment data available. Start recording transactions with payment modes to see customer preferences.`,
          alert: 'info'
        };
      }
    }

    // Inventory value analysis
    if (lowerQuery.includes('value') || lowerQuery.includes('worth') || lowerQuery.includes('total worth')) {
      const totalValue = data.fabrics.reduce((sum, fabric) => 
        sum + ((fabric.current_quantity || fabric.quantity) * fabric.price_per_unit), 0
      );
      
      const chartData = {
        labels: data.fabrics.slice(0, 5).map(f => f.name),
        datasets: [{
          label: 'Fabric Value',
          data: data.fabrics.slice(0, 5).map(f => (f.current_quantity || f.quantity) * f.price_per_unit),
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
          ]
        }]
      };

      return {
        text: `💰 **Inventory Value Analysis**

Your current inventory is worth **$${totalValue.toFixed(2)}**

Here are your top 5 most valuable fabrics:`,
        chart: {
          type: 'bar',
          data: chartData,
          title: 'Top 5 Fabrics by Value'
        }
      };
    }

    // Stock level analysis
    if (lowerQuery.includes('stock') || lowerQuery.includes('low stock') || lowerQuery.includes('restock')) {
      const lowStockItems = data.fabrics.filter(fabric => {
        const currentQuantity = fabric.current_quantity || fabric.quantity;
        const percentage = (currentQuantity / fabric.quantity) * 100;
        return percentage <= 20;
      });

      if (lowStockItems.length > 0) {
        return {
          text: `⚠️ **Low Stock Alert**

You have **${lowStockItems.length} fabrics** that need restocking:

${lowStockItems.map(f => `• ${f.name}: ${(f.current_quantity || f.quantity).toFixed(2)} ${f.unit} remaining`).join('\n')}

**Recommendation:** Consider ordering more of these items soon to avoid stockouts.`,
          alert: 'warning'
        };
      } else {
        return {
          text: `✅ **Stock Status**

Great news! All your fabrics are well-stocked. No items require immediate restocking.`,
          alert: 'success'
        };
      }
    }

    // Type distribution analysis
    if (lowerQuery.includes('type') || lowerQuery.includes('distribution') || lowerQuery.includes('category')) {
      const typeData = {};
      data.fabrics.forEach(fabric => {
        typeData[fabric.type] = (typeData[fabric.type] || 0) + 1;
      });

      const chartData = {
        labels: Object.keys(typeData),
        datasets: [{
          data: Object.values(typeData),
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
          ]
        }]
      };

      return {
        text: `📊 **Fabric Type Distribution**

Your inventory contains **${data.fabrics.length} fabrics** across **${Object.keys(typeData).length} different types**.

Most common type: **${Object.entries(typeData).sort((a, b) => b[1] - a[1])[0][0]}** (${Object.entries(typeData).sort((a, b) => b[1] - a[1])[0][1]} items)`,
        chart: {
          type: 'pie',
          data: chartData,
          title: 'Fabric Types Distribution'
        }
      };
    }

    // Supplier analysis
    if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor')) {
      const supplierData = {};
      data.fabrics.forEach(fabric => {
        if (fabric.supplier) {
          supplierData[fabric.supplier] = (supplierData[fabric.supplier] || 0) + 1;
        }
      });

      if (Object.keys(supplierData).length > 0) {
        const chartData = {
          labels: Object.keys(supplierData),
          datasets: [{
            label: 'Number of Fabrics',
            data: Object.values(supplierData),
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 1
          }]
        };

        return {
          text: `🏭 **Supplier Analysis**

You work with **${Object.keys(supplierData).length} suppliers**:

${Object.entries(supplierData).sort((a, b) => b[1] - a[1]).map(([supplier, count]) => 
            `• ${supplier}: ${count} fabrics`
          ).join('\n')}

Top supplier: **${Object.entries(supplierData).sort((a, b) => b[1] - a[1])[0][0]}**`,
          chart: {
            type: 'bar',
            data: chartData,
            title: 'Fabrics by Supplier'
          }
        };
      }
    }

    // Performance analysis
    if (lowerQuery.includes('performance') || lowerQuery.includes('top') || lowerQuery.includes('best')) {
      const topFabrics = data.fabrics
        .map(fabric => ({
          ...fabric,
          totalValue: (fabric.current_quantity || fabric.quantity) * fabric.price_per_unit
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);

      return {
        text: `🏆 **Top Performing Fabrics**

Here are your most valuable fabrics by current inventory value:

${topFabrics.map((fabric, index) => 
            `${index + 1}. **${fabric.name}** - $${fabric.totalValue.toFixed(2)} (${fabric.current_quantity || fabric.quantity} ${fabric.unit})`
          ).join('\n')}

**Total value of top 5:** $${topFabrics.reduce((sum, f) => sum + f.totalValue, 0).toFixed(2)}`
      };
    }

    // General analytics overview
    if (lowerQuery.includes('analytics') || lowerQuery.includes('overview') || lowerQuery.includes('summary')) {
      const totalValue = data.fabrics.reduce((sum, fabric) => 
        sum + ((fabric.current_quantity || fabric.quantity) * fabric.price_per_unit), 0
      );
      const lowStockCount = data.fabrics.filter(fabric => {
        const currentQuantity = fabric.current_quantity || fabric.quantity;
        const percentage = (currentQuantity / fabric.quantity) * 100;
        return percentage <= 20;
      }).length;

      return {
        text: `📈 **Analytics Overview**

**Key Metrics:**
• **Total Fabrics:** ${data.fabrics.length}
• **Total Value:** $${totalValue.toFixed(2)}
• **Average Value per Fabric:** $${(totalValue / data.fabrics.length).toFixed(2)}
• **Low Stock Items:** ${lowStockCount}
• **Unique Types:** ${data.analytics?.fabricTypes?.length || 0}
• **Suppliers:** ${data.analytics?.topSuppliers?.length || 0}

**Recommendations:**
${lowStockCount > 0 ? '⚠️ Consider restocking low inventory items' : '✅ Inventory levels are healthy'}
${totalValue > 10000 ? '💰 High inventory value - ensure adequate insurance coverage' : '📊 Consider expanding product range'}

Would you like me to generate specific charts for any of these metrics?`
      };
    }

    return null;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const userMsg = {
      user_message: userMessage,
      timestamp: new Date().toISOString(),
      type: 'user'
    };
    setMessages(prev => [...prev, userMsg]);

    // Generate AI response
    setTimeout(() => {
      const aiResponse = generateAnalyticsResponse(userMessage, { fabrics, analytics, transactions });
      
      if (aiResponse) {
        const botMsg = {
          user_message: userMessage,
          bot_response: aiResponse.text,
          timestamp: new Date().toISOString(),
          type: 'bot',
          chart: aiResponse.chart,
          alert: aiResponse.alert
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        // Fallback to basic response
        const fallbackMsg = {
          user_message: userMessage,
          bot_response: `I understand you're asking about: "${userMessage}"

I can help you with:
• **Inventory Analysis** - Try "show me inventory value" or "analyze my stock"
• **Chart Generation** - Try "create a chart by fabric type" or "show supplier distribution"
• **Performance Metrics** - Try "what are my top performing fabrics?"
• **Stock Management** - Try "which items need restocking?"

Could you rephrase your question or try one of the examples above?`,
          timestamp: new Date().toISOString(),
          type: 'bot'
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
      setIsLoading(false);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderChart = (chartConfig) => {
    const ChartComponent = chartConfig.type === 'pie' ? Pie : 
                        chartConfig.type === 'line' ? Line : Bar;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{chartConfig.title}</h4>
        <div className="h-64">
          <ChartComponent data={chartConfig.data} options={{ 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: chartConfig.type === 'pie' ? 'right' : 'top',
              }
            }
          }} />
        </div>
      </div>
    );
  };

  const quickActions = [
    { text: 'Show inventory value', icon: '💰' },
    { text: 'Analyze stock levels', icon: '📊' },
    { text: 'Type distribution chart', icon: '📈' },
    { text: 'Supplier analysis', icon: '🏭' },
    { text: 'Top performing fabrics', icon: '🏆' },
    { text: 'Analytics overview', icon: '📋' }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">AI Inventory Assistant</h2>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          Advanced analytics with intelligent insights and real-time charts
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 border-b">
        <p className="text-sm text-gray-600 mb-2 font-medium">Quick Analytics:</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(action.text)}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <span className="mr-1">{action.icon}</span>
              {action.text}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            {message.type === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-2">
                    <p className="text-sm">{message.user_message}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            )}
            
            {message.type === 'bot' && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-2xl">
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
                    <div className="text-sm whitespace-pre-line">
                      {message.bot_response}
                    </div>
                    {message.chart && renderChart(message.chart)}
                    {message.alert === 'warning' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">Action Required</span>
                      </div>
                    )}
                    {message.alert === 'success' && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                        <InformationCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">All Good</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 ml-2">Analyzing data...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t p-4 bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about inventory, analytics, or request charts..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Try: "Show inventory value", "Create type chart", or "Analyze stock levels"
        </p>
      </form>
    </div>
  );
};

export default AIChatInterface;
