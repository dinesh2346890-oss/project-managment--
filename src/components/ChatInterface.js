import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sessionId = 'user-session-' + Date.now();

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/history/${sessionId}`);
      if (response.data.length > 0) {
        setMessages(response.data.reverse());
      } else {
        // Add welcome message
        setMessages([{
          user_message: '',
          bot_response: 'Hello! I\'m your fabric inventory assistant. I can help you with:\n\n• Managing your fabric inventory\n• Adding and updating fabric records\n• Checking stock levels\n• Viewing analytics and reports\n• Search and filter fabrics\n\nWhat would you like to know today?',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Add welcome message on error
      setMessages([{
        user_message: '',
        bot_response: 'Hello! I\'m your fabric inventory assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: userMessage,
        session_id: sessionId
      });

      const newMessage = {
        user_message: userMessage,
        bot_response: response.data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        user_message: userMessage,
        bot_response: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickActions = [
    { text: 'How do I add a new fabric?', icon: '➕' },
    { text: 'Show me inventory analytics', icon: '📊' },
    { text: 'Check low stock items', icon: '⚠️' },
    { text: 'How to search fabrics?', icon: '🔍' },
    { text: 'Export inventory data', icon: '📥' },
    { text: 'Help with suppliers', icon: '🏭' }
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">Fabric Inventory Assistant</h2>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          Ask me anything about your fabric inventory management
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 border-b">
        <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.text)}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
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
            {message.user_message && (
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
            
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                  <p className="text-sm whitespace-pre-line">{message.bot_response}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your fabric inventory..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: Try asking about inventory status, adding fabrics, or viewing analytics
        </p>
      </form>
    </div>
  );
};

export default ChatInterface;
