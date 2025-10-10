import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Corrected import path
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        const result = await login({ email, password });
        if (result.success) {
            navigate('/scouts-portal');
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-red-800 font-serif">Sign In</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={password}
                            onChange={onChange}
                            minLength="6"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <button
                            type="submit"
                            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
                        >
                            Login
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-red-600 hover:text-red-800">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
