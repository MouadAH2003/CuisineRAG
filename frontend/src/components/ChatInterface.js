import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import SearchModeToggle from './SearchModeToggle';
import '../styles/ChatInterface.css';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';

const API_URL = 'http://localhost:8000';

const ChatInterface = ({ currentConversationId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useRealTimeSearch, setUseRealTimeSearch] = useState(false); // Toggle for mode
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch messages when the currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      fetchMessages(currentConversationId);
    } else {
      setMessages([]); // Clear messages if no conversation is selected
    }
  }, [currentConversationId]);

  const fetchMessages = async (conversationId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleModeToggle = () => {
    const newMode = !useRealTimeSearch;
    setUseRealTimeSearch(newMode);

    // Add a temporary system message for mode change
    const modeMessage = {
      id: Date.now(),
      text: `Switched to ${newMode ? 'real-time search' : 'knowledge base'} mode.`,
      sender: 'system',
    };
    setMessages((prev) => [...prev, modeMessage]);

    // Remove the system message after 1.5 seconds
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== modeMessage.id));
    }, 1500);
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    try {
      setIsLoading(true);
      setError(null);

      const userMessage = {
        id: Date.now(),
        text: input,
        sender: 'user',
        status: 'sending',
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      const response = await api.post('/chat', {
        message: input,
        conversation_id: currentConversationId,
        use_real_time: useRealTimeSearch, // Ensure toggle state is sent to the backend
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.message.content,
        sender: 'bot',
        metadata: response.data.message.meta_data,
        citations: response.data.message.referenced_chunks,
        status: 'received',
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === Date.now() ? { ...msg, status: 'failed' } : msg
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryMessage = async (messageId) => {
    const failedMessage = messages.find((msg) => msg.id === messageId);
    if (!failedMessage) return;

    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );

    setInput(failedMessage.text);
    await sendMessage();
  };

  return (
    <div className="chat-interface">
      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <div className="error-content">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
          <button
            className="close-button"
            onClick={() => setError(null)}
            aria-label="Close error message"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="messages-container" role="log">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">
              <i className="fas fa-utensils"></i>
            </div>
            <h2>Welcome to CuisineRAG!</h2>
            <p>Ask me anything about Moroccan cuisine and recipes.</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              {...message}
              onRetry={() => retryMessage(message.id)}
            />
          ))
        )}
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <SearchModeToggle
          isEnabled={useRealTimeSearch}
          onToggle={handleModeToggle}
        />
        <textarea
          ref={inputRef}
          className="message-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Moroccan recipes..."
          rows={1}
          disabled={isLoading}
          aria-label="Message input"
        />
        <button
          className="send-button"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          {isLoading ? (
            <Spinner
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;