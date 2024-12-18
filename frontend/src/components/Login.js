import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import logo from '../assets/cuisinerag_logo_2.png';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error, clearError, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the return URL from location state or default to home
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        // Clear any existing errors when component mounts
        clearError();
    }, [clearError]);

    useEffect(() => {
        // Redirect if already authenticated
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const validateForm = () => {
        const errors = {};
        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        // Validate form
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await login(formData.username, formData.password);
            if (success) {
                navigate(from, { replace: true });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <img 
                        src={logo} 
                        alt="CuisineRAG Logo" 
                        className="auth-logo"
                        onClick={() => navigate('/')}
                        style={{ cursor: 'pointer' }}
                    />
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to continue to CuisineRAG</p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="username">
                            Username
                            {validationErrors.username && (
                                <span className="error-text">
                                    {validationErrors.username}
                                </span>
                            )}
                        </label>
                        <div className="input-group">
                            <span className="input-icon">
                                <i className="fas fa-user"></i>
                            </span>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className={`form-control ${validationErrors.username ? 'is-invalid' : ''}`}
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                            {validationErrors.password && (
                                <span className="error-text">
                                    {validationErrors.password}
                                </span>
                            )}
                        </label>
                        <div className="input-group">
                            <span className="input-icon">
                                <i className="fas fa-lock"></i>
                            </span>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt me-2"></i>
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">
                            Create Account
                        </Link>
                    </p>
                    <Link to="/forgot-password" className="auth-link small">
                        Forgot your password?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
