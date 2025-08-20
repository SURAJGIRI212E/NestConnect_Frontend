import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import logo from '../logo.png';
import { MdOutlineKeyboardBackspace } from "react-icons/md"

const ResetPassword = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: '', confirmpassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await axiosInstance.patch(`/api/auth/resetPassword/${token}`, formData);
      if (response.data.status === 'success') {
        setSuccess('Password reset successful! You can now log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.message || 'Password reset failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-200 to-blue-400">
       
      <div className="p-8 w-96 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg border border-white border-opacity-30">
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white px-3 py-1 font-bold rounded-2xl text-blue-700 hover:bg-blue-50 text-xl"
          >
            <MdOutlineKeyboardBackspace className="inline-block " />
          </button>
        <div className="flex justify-center mb-6">
          <img src={logo} alt="X Logo" className="w-10" />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Reset Password</h1>
    
        {error && (
          <div className="mb-4 p-2 bg-red-400 bg-opacity-30 text-red-800 rounded-md">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-2 bg-green-400 bg-opacity-30 text-green-800 rounded-md">{success}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="New Password"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
          />
          <input
            type="password"
            name="confirmpassword"
            value={formData.confirmpassword}
            onChange={handleChange}
            placeholder="Confirm New Password"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
          {/* Back and Login links */}
        <div className="flex justify-center mt-6 space-x-4">
        
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-blue-700 hover:underline text-sm font-semibold"
          >
            Login
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default ResetPassword;
