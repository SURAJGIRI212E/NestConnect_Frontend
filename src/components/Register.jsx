import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.png';
import axiosInstance from '../utils/axios';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/register', formData);
      if (response.data.userId) {
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
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
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign up for Twitter</h1>
        {error && (
          <div className="mb-4 p-2 bg-red-400 bg-opacity-30 text-red-800 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-2 bg-green-400 bg-opacity-30 text-green-800 rounded-md">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
          />
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
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
          />
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-blue-700 hover:underline bg-transparent border-none cursor-pointer">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
