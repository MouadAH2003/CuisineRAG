import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import '../styles/Sidebar.css';

const API_URL = 'http://localhost:8000';

const Sidebar = ({ onConversationSelect, currentConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State for sidebar toggle

  const getToken = () => localStorage.getItem('token');

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/conversations');
      // Access the nested conversations array
      setConversations(Array.isArray(response.data.conversations) ? response.data.conversations : []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await api.post('/conversations', {
        title: 'New Conversation',
      });
      setConversations((prev) => [response.data, ...prev]);
      onConversationSelect(response.data.id);
    } catch (err) {
      console.error('Error creating new conversation:', err);
      setError('Failed to create new conversation');
    }
  };

  const getConversationPreview = (conversation) => {
    if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      return lastMessage.content.substring(0, 50) + '...';
    }
    return 'No messages yet';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((conv) =>
        conv.title && conv.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <>
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header p-3 d-flex justify-content-between align-items-center">
          <button
            className="btn btn-primary w-100 mb-3"
            onClick={handleNewConversation}
          >
            <i className="fas fa-plus me-2"></i>
            New Chat
          </button>
          <button
            className="btn btn-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>
        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search search-icon"></i>
        </div>

        <div className="sidebar-content flex-grow-1 overflow-auto">
          {isLoading ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-white p-3 ">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            <div className="conversation-list">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item p-3 ${
                    currentConversationId === conversation.id ? 'active' : ''
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <div className="conversation-title">
                    <i className="fas fa-comments me-2"></i>
                    {conversation.title || 'Untitled Conversation'}
                  </div>
                  <div className="conversation-preview">
                    {getConversationPreview(conversation)}
                  </div>
                  <div className="conversation-date">
                    {formatDate(conversation.last_activity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Toggle button outside the sidebar */}
      {!isSidebarOpen && (
        <button
          className="btn btn-toggle-outside"
          onClick={() => setIsSidebarOpen(true)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      )}
    </>
  );
};

export default Sidebar;