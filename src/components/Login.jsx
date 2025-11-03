import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../logo.png';
import axiosInstance from '../utils/axios';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
const [errorForget, setErrorForget]=useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
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

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(cooldownRef.current);
  }, [cooldown]);

  // Forgot password handler
  const handleForgotPassword = async () => {
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/forgetPassword', { email: forgotEmail });
      if (response.data.status === 'success') {
        setForgotMsg('Password reset link sent to your email.');
        setCooldown(120); // Start 2-minute cooldown
      } else {
        setErrorForget(true)
        setForgotMsg(response.data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setErrorForget(true)
      setForgotMsg(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-200 to-blue-400">
      <div className="p-8 w-96 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg border border-white border-opacity-30">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="X Logo" className="w-10" />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign in to NestConnect</h1>
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
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              disabled={loading}
              className="w-full px-4 py-2 pr-10 border border-white border-opacity-30 rounded-md bg-white bg-opacity-10 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer" onClick={() => setShowForgotModal(true)}>
            Forgot password?
          </button>
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-blue-700 hover:underline bg-transparent border-none cursor-pointer">
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-center">Forgot Password</h2>
            <input
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              disabled={forgotLoading}
            />
            <button
              onClick={handleForgotPassword}
              disabled={forgotLoading || !forgotEmail || cooldown > 0}
              className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-90 mb-2"
            >
              {forgotLoading
                ? 'Sending...'
                : cooldown > 0
                  ? `Wait ${cooldown}s to resend`
                  : 'Send Reset Link'}
            </button>
            {forgotMsg && <div className={`text-center mb-2 ${errorForget?'text-red-600':'text-green-700'}`}>{forgotMsg}</div>}
            <button
              onClick={() => { setShowForgotModal(false); setForgotEmail(''); setForgotMsg(''); }}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded-full font-semibold mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
