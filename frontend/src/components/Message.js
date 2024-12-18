import React, { useState, useEffect } from 'react';
import '../styles/Message.css';

const Message = ({ 
  text, 
  sender, 
  metadata, 
  citations, 
  status = 'sent',
  onRetry 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const renderMessageStatus = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="message-status sending">
            <i className="fas fa-circle-notch fa-spin"></i>
          </div>
        );
      case 'sent':
        return (
          <div className="message-status sent">
            <i className="fas fa-check"></i>
          </div>
        );
      case 'failed':
        return (
          <div className="message-status failed">
            <i className="fas fa-exclamation-circle"></i>
            <button 
              onClick={onRetry}
              className="retry-button"
              aria-label="Retry sending message"
            >
              <i className="fas fa-redo"></i>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCitations = () => {
    if (!citations || citations.length === 0) return null;

    return (
      <div className="citations-container">
        <button 
          className="citations-toggle"
          onClick={() => setShowCitations(!showCitations)}
          aria-expanded={showCitations}
        >
          <i className={`fas fa-chevron-${showCitations ? 'up' : 'down'}`}></i>
          {`${citations.length} Source${citations.length > 1 ? 's' : ''}`}
        </button>
        
        {showCitations && (
          <div className="citations-list" role="region" aria-label="Source citations">
            {citations.map((citation, index) => (
              <div key={index} className="citation-item">
                <div className="citation-header">
                  <i className="fas fa-book"></i>
                  <span className="citation-title">{citation.file_name}</span>
                </div>
                <div className="citation-content">
                  <blockquote>{citation.text}</blockquote>
                  {citation.metadata && (
                    <div className="citation-metadata">
                      <span className="position">
                        <i className="fas fa-map-marker-alt"></i>
                        {Math.round(citation.relative_position * 100)}% through document
                      </span>
                      {citation.metadata.page && (
                        <span className="page">
                          <i className="fas fa-file-alt"></i>
                          Page {citation.metadata.page}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!metadata) return null;

    return (
      <div className="message-metadata">
        {metadata.confidence_score && (
          <div className="metadata-item confidence">
            <i className="fas fa-chart-line"></i>
            <span>{Math.round(metadata.confidence_score * 100)}% confidence</span>
          </div>
        )}
        {metadata.processing_time && (
          <div className="metadata-item processing-time">
            <i className="fas fa-clock"></i>
            <span>{metadata.processing_time.toFixed(2)}s</span>
          </div>
        )}
        {metadata.source && (
          <div className="metadata-item source">
            <i className="fas fa-database"></i>
            <span>{metadata.source}</span>
          </div>
        )}
      </div>
    );
  };

  const messageContent = typeof text === 'string' ? text : 'Invalid message';
  const shouldTruncate = messageContent.length > 300 && !isExpanded;

  return (
    <div 
      className={`message ${sender} ${isVisible ? 'visible' : ''} ${status}`}
      role={sender === 'bot' ? 'article' : 'comment'}
    >
      <div className="message-bubble">
        <div className="message-content">
          {shouldTruncate ? (
            <>
              <p>{messageContent.slice(0, 300)}...</p>
              <button 
                className="expand-button"
                onClick={() => setIsExpanded(true)}
                aria-expanded="false"
              >
                Read more
              </button>
            </>
          ) : (
            <p>{messageContent}</p>
          )}
          {isExpanded && (
            <button 
              className="expand-button"
              onClick={() => setIsExpanded(false)}
              aria-expanded="true"
            >
              Show less
            </button>
          )}
          {renderMessageStatus()}
        </div>
        {renderMetadata()}
        {renderCitations()}
      </div>
    </div>
  );
};

export default Message;
