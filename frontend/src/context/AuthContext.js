import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for existing token and user data on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('username');

        if (token && storedUser) {
            setUser({
                username: storedUser,
                token: token
            });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            setError(null);
            const response = await axios.post('http://localhost:8000/token', 
                new URLSearchParams({
                    username,
                    password,
                    grant_type: 'password'
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token } = response.data;
            
            // Store token and user data
            localStorage.setItem('token', access_token);
            localStorage.setItem('username', username);
            
            // Update state
            setUser({
                username,
                token: access_token
            });

            // Configure axios defaults for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            
            return true;
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to login');
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            setError(null);
            const response = await axios.post('http://localhost:8000/register', {
                username,
                email,
                password
            });

            // Automatically login after successful registration
            return await login(username, password);
        } catch (err) {
            console.error("Registration error:", err.response?.data);
            setError(err.response?.data?.detail || 'Failed to register');
            return false;
        }
    };

    const logout = () => {
        // Clear stored data
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        
        // Reset state
        setUser(null);
        
        // Remove axios default header
        delete axios.defaults.headers.common['Authorization'];
    };

    const clearError = () => {
        setError(null);
    };

    // Create axios interceptor for token handling
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    // Unauthorized - clear user data and redirect to login
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            // Remove interceptor on cleanup
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user,
        getToken: () => localStorage.getItem('token')
    };

    if (loading) {
        return (
            <div className="auth-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};