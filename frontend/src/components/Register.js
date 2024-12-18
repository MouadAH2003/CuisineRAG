import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import logo from '../assets/cuisinerag_logo_2.png';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, error, clearError, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Clear any existing errors when component mounts
        clearError();
    }, [clearError]);

    useEffect(() => {
        // Redirect if already authenticated
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const validateForm = () => {
        const errors = {};
        
        // Username validation
        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = 'Username can only contain letters, numbers, and underscores';
        }

        // Email validation
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
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
            const success = await register(
                formData.username,
                formData.email,
                formData.password
            );
            if (success) {
                navigate('/');
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
                    <h2>Create Account</h2>
                    <p className="auth-subtitle">Join CuisineRAG to explore Moroccan recipes</p>
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
                                placeholder="Choose a username"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                            {validationErrors.email && (
                                <span className="error-text">
                                    {validationErrors.email}
                                </span>
                            )}
                        </label>
                        <div className="input-group">
                            <span className="input-icon">
                                <i className="fas fa-envelope"></i>
                            </span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
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
                                placeholder="Create a password"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password
                            {validationErrors.confirmPassword && (
                                <span className="error-text">
                                    {validationErrors.confirmPassword}
                                </span>
                            )}
                        </label>
                        <div className="input-group">
                            <span className="input-icon">
                                <i className="fas fa-lock"></i>
                            </span>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
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
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus me-2"></i>
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
