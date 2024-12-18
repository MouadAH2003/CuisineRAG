import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './styles/App.css';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-container">
          <div className="spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route wrapper component (redirects to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-container">
          <div className="spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Layout component
const AppLayout = () => {
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true);
  const [currentConversationId, setCurrentConversationId] = React.useState(null);
  const [useRealTimeSearch, setUseRealTimeSearch] = React.useState(false);

  // Handle responsive sidebar
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarVisible(false);
      } else {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="app-container">
      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div className="main-container">
        <Sidebar 
          isVisible={isSidebarVisible}
          onConversationSelect={setCurrentConversationId}
          currentConversationId={currentConversationId}
        />
        
        <main className={`main-content ${isSidebarVisible ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <ChatInterface 
                    currentConversationId={currentConversationId}
                    useRealTimeSearch={useRealTimeSearch}
                    onToggleRealTimeSearch={setUseRealTimeSearch}
                  />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>

      {/* Mobile sidebar toggle button */}
      {window.innerWidth < 768 && (
        <button 
          className="mobile-sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <i className={`fas fa-${isSidebarVisible ? 'times' : 'bars'}`}></i>
        </button>
      )}
    </div>
  );
};

// Root App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
