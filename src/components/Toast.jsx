import React, { useState, useEffect, createContext, useContext } from 'react';
import { IoClose } from 'react-icons/io5';

export let showGlobalToast = null;

export const setGlobalShowToast = (toastFn) => {
  showGlobalToast = toastFn;
};

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  // Set the global showToast function when component mounts
  useEffect(() => {
    setGlobalShowToast(showToast);
    return () => {
      setGlobalShowToast(null); // Clear on unmount
    };
  }, []);

  const hideToast = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast = ({ message, type, onClose }) => {
  let bgColor = 'bg-gray-500';
  let borderColor = 'border-gray-600';
  let textColor = 'text-white';

  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      borderColor = 'border-green-600';
      break;
    case 'error':
      bgColor = 'bg-red-600';
      borderColor = 'border-red-600';
      break;
    case 'info':
      bgColor = 'bg-blue-600';
      borderColor = 'border-blue-600';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500';
      borderColor = 'border-yellow-600';
      textColor = 'text-gray-800'; // Ensure readable text on yellow
      break;
    default:
      break;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center justify-between space-x-4 ${bgColor} ${textColor} border-l-4 ${borderColor} z-50`}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className={`flex items-center justify-center w-6 h-6 rounded-full ${textColor === 'text-white' ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : 'bg-gray-800 bg-opacity-20 hover:bg-opacity-30'}`}
        aria-label="Close"
      >
        <IoClose size="16px" />
      </button>
    </div>
  );
}; 