import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import { Login } from './components/Login';
import { Premium } from './components/Premium';
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoadingShimmer from './components/LoadingShimmer';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import logo from './logo.png';


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [showShimmer, setShowShimmer] = useState(true);
  const [contentClass, setContentClass] = useState('');

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowShimmer(false);
        setContentClass('animate-fadeIn');
      }, 500); // Duration of fadeOut animation
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (showShimmer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-200 to-blue-400">
        <div className="relative flex items-center justify-center">
          {/* Logo with higher opacity and slight glow */}
          <img 
            src={logo} 
            alt="Logo" 
            className="w-20 opacity-75 absolute z-10 drop-shadow-lg" 
          />
          <LoadingShimmer/>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <div className={contentClass}>{children}</div>;
};

// Public Route component (only accessible when not logged in)
const PublicRoute = ({ children }) => {
  const { user, loading, hasCheckedAuth } = useAuth();
  const [showShimmer, setShowShimmer] = useState(true);
  const [shimmerClass, setShimmerClass] = useState('');
  const [contentClass, setContentClass] = useState('');

  useEffect(() => {
    if (!loading && hasCheckedAuth) {
      const timer = setTimeout(() => {
        setShowShimmer(false);
        setShimmerClass('animate-fadeOut');
        setContentClass('animate-fadeIn');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, hasCheckedAuth]);

  // Show loading spinner with logo for both initial auth check and loading states
  
  if (!hasCheckedAuth || loading || showShimmer) {
    return <LoadingShimmer className={shimmerClass} type="login-page" />;
  }
  if (user) {
    return <Navigate to="/home" />;
  }

  return <div className={contentClass}>{children}</div>;
};

function App() {
  // Use the AuthContext to check if auth check is done
  const { hasCheckedAuth } = useAuth();

  // Only render routes after auth check is complete
  if (!hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-200 to-blue-400">
        <div className="relative flex items-center justify-center">
          {/* Logo with higher opacity and slight glow */}
          <img 
            src={logo} 
            alt="Logo" 
            className="w-20 opacity-75 absolute z-10 drop-shadow-lg" 
          />

          {/* Spinner with shimmer effect */}
          <LoadingShimmer/>
        </div>
      </div>
    );
  }

  
  return (
    <Router>
      <SocketProvider>
        <div className="App no-scrollbar overflow-auto">
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password/:token" 
              element={
                <PublicRoute>
                  <ResetPassword />
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
            <Route 
              path="/home/*" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/premium" 
              element={
                <ProtectedRoute>
                  <Premium />
                </ProtectedRoute>
              } 
            />
           
            <Route 
              path="/" 
              element={<Navigate to="/home" />} 
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
