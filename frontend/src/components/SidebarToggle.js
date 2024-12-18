import React from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

const SidebarToggle = ({ 
  isSidebarVisible, 
  onToggleSidebar, 
  className = '' 
}) => {
  return (
    <button 
      onClick={onToggleSidebar}
      className={`sidebar-toggle-btn ${className}`}
      aria-label={isSidebarVisible ? "Close Sidebar" : "Open Sidebar"}
    >
      {isSidebarVisible ? (
        <ChevronLeft className="sidebar-toggle-icon" />
      ) : (
        <ChevronRight className="sidebar-toggle-icon" />
      )}
    </button>
  );
};

export default SidebarToggle;