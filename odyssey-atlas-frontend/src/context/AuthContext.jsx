import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// Utility to set the auth token for all axios requests
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
    }
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        token: localStorage.getItem('token'),
        isAuthenticated: null,
        loading: true,
        user: null,
    });

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setAuthToken(token);
                try {
                    const res = await axios.get('http://localhost:3001/api/auth');
                    setAuthState({
                        token: token,
                        isAuthenticated: true,
                        loading: false,
                        user: res.data,
                    });
                } catch (err) {
                    localStorage.removeItem('token');
                    setAuthState({
                        token: null,
                        isAuthenticated: false,
                        loading: false,
                        user: null,
                    });
                }
            } else {
                setAuthState({
                    token: null,
                    isAuthenticated: false,
                    loading: false,
                    user: null,
                });
            }
        };
        loadUser();
    }, []);

    const register = async ({ username, email, password }) => {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const body = JSON.stringify({ username, email, password });
        try {
            const res = await axios.post('http://localhost:3001/api/register', body, config);
            localStorage.setItem('token', res.data.token);
            await loadUserAfterAuth();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response.data.msg };
        }
    };

    const login = async ({ email, password }) => {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const body = JSON.stringify({ email, password });
        try {
            const res = await axios.post('http://localhost:3001/api/login', body, config);
            localStorage.setItem('token', res.data.token);
            await loadUserAfterAuth();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response.data.msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthState({
            token: null,
            isAuthenticated: false,
            loading: false,
            user: null,
        });
        setAuthToken(null);
    };

    const loadUserAfterAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            try {
                const res = await axios.get('http://localhost:3001/api/auth');
                setAuthState({
                    token: token,
                    isAuthenticated: true,
                    loading: false,
                    user: res.data,
                });
            } catch (err) {
                 logout();
            }
        }
    };


    const value = {
        ...authState,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!authState.loading && children}
        </AuthContext.Provider>
    );
};
