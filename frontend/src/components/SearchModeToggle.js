import React from 'react';
import '../styles/SearchModeToggle.css';

const SearchModeToggle = ({ isEnabled, onToggle }) => {
  return (
    <div className="search-mode-toggle">
      <div className="toggle-label">
        <i className="fas fa-book"></i>
      </div>
      
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label="Toggle search mode"
        />
        <span className="toggle-slider">
          <span className="toggle-icon">
          </span>
        </span>
      </label>
      
      <div className="toggle-label">
        <i className="fas fa-globe"></i>
      </div>

      <div 
        className={`mode-tooltip ${isEnabled ? 'real-time' : 'knowledge-base'}`}
        role="status"
        aria-live="polite"
      >
        <i className={`fas fa-${isEnabled ? 'globe' : 'book'}`}></i>
        <span>
          {isEnabled 
            ? 'Search the web enabled'
            : 'knowledge Base enabled'
          }
        </span>
      </div>
    </div>
  );
};

export default SearchModeToggle;
