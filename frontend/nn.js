import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import SearchModeToggle from './SearchModeToggle';
import axios from 'axios';
import '../styles/ChatInterface.css';
import { Search, Sparkles, Send } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [useRealTimeSearch, setUseRealTimeSearch] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem('token');

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    try {
      setIsLoading(true);
      setError(null);

      const userMessage = { text: input, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      const response = await api.post('/chat', {
        message: input,
        conversation_id: currentConversationId,
        use_real_time: useRealTimeSearch
      });

      if (!currentConversationId) {
        setCurrentConversationId(response.data.conversation.id);
      }

      const botMessage = {
        text: response.data.message.content,
        sender: 'bot',
        metadata: response.data.message.meta_data,
        citations: response.data.message.referenced_chunks
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setMessages(prevMessages => prevMessages.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleModeToggle = () => {
    const newMode = !useRealTimeSearch;
    setUseRealTimeSearch(newMode);

    // Create temporary mode switch message
    const modeMessage = {
      text: `Switched to ${newMode ? 'real-time search' : 'knowledge base'} mode`,
      sender: 'system',
      timestamp: new Date().toLocaleTimeString(),
    };

    // Temporarily display mode switch message
    setMessages(prev => [...prev, modeMessage]);
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg !== modeMessage));
    }, 1500);
  };

  return (
    <div className={`chat-interface ${useRealTimeSearch ? 'real-time-mode' : 'knowledge-base-mode'}`}>
      {/* Mode Toggle */}
      <div className="mode-toggle-container">
        <div className="mode-toggle flex items-center justify-center space-x-4">
        <Sparkles
            className={`mode-icon ${!useRealTimeSearch ? 'text-primary' : 'text-gray-400'}`}
            size={24}
          />
          <label className="switch relative inline-block w-16 h-8">
            <input
              type="checkbox"
              className="opacity-0 w-0 h-0"
              checked={useRealTimeSearch}
              onChange={handleModeToggle}
            />
            <span
              className={`slider absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300
                ${useRealTimeSearch ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span
                className={`dot absolute h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300
                  ${useRealTimeSearch ? 'translate-x-8' : 'translate-x-1'}`}
              />
            </span>
          </label>

            <Search
            className={`mode-icon ${useRealTimeSearch ? 'text-primary' : 'text-gray-400'}`}
            size={24}
          />
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window bg-white p-4 rounded-lg shadow-md max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text- py-10">
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ease-in-out transform
                  ${message.sender === 'user' ? 'translate-x-2' : '-translate-x-2'}
                  ${message.sender === 'system' ? 'text-center text-gray-600 italic' : ''}`}
              >
                <Message
                  text={message.text}
                  sender={message.sender}
                  metadata={message.metadata}
                  citations={message.citations}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`mt-4 transition-all duration-300 ${isFocused ? 'shadow-lg' : 'shadow-md'}`}>
        <div className="input-group flex items-center bg-white rounded-full p-2 space-x-2">
          <textarea
            className="flex-grow p-2 rounded-lg resize-none focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask me about Moroccan cuisine..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`
              rounded-full p-2 transition-all duration-300
              ${input.trim() && !isLoading
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <div className="animate-spin">🍲</div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
