import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../logo.png';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/home');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-200 to-blue-400">
      <div className="p-8 w-96 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg border border-white border-opacity-30">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="X Logo" className="w-10" />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign in to Twitter</h1>
        {error && (
          <div className="mb-4 p-2 bg-red-400 bg-opacity-30 text-red-800 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-full font-semibold hover:bg-blue-600 transition duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button className="text-blue-700 hover:underline bg-transparent border-none cursor-pointer">
            Forgot password?
          </button>
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Don't have an account?{" "}
            <button className="text-blue-700 hover:underline bg-transparent border-none cursor-pointer">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
