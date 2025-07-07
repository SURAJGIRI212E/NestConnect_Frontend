import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import { Login } from './components/Login';
import { Premium } from './components/Premium';
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoadingShimmer from './components/LoadingShimmer';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [showShimmer, setShowShimmer] = useState(true);
  const [shimmerClass, setShimmerClass] = useState('');
  const [contentClass, setContentClass] = useState('');

  useEffect(() => {
    if (!loading) {
      setShimmerClass('animate-fadeOut');
      const timer = setTimeout(() => {
        setShowShimmer(false);
        setContentClass('animate-fadeIn');
      }, 500); // Duration of fadeOut animation
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (showShimmer) {
    return <LoadingShimmer className={shimmerClass}/>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <div className={contentClass}>{children}</div>;
};

// Public Route component (only accessible when not logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [showShimmer, setShowShimmer] = useState(true);
  const [shimmerClass, setShimmerClass] = useState('');
  const [contentClass, setContentClass] = useState('');

  useEffect(() => {
    if (!loading) {
      setShimmerClass('animate-fadeOut');
      const timer = setTimeout(() => {
        setShowShimmer(false);
        setContentClass('animate-fadeIn');
      }, 500); // Duration of fadeOut animation
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (showShimmer) {
    return <LoadingShimmer className={shimmerClass} type="login-page" />;
  }

  if (user) {
    return <Navigate to="/home" />;
  }

  return <div className={contentClass}>{children}</div>;
};

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
