import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose = () => {}, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseClasses = "fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out z-50";
  const typeClasses = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-600 text-white"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} animate-slide-in`}>
      <div className="flex items-center space-x-2">
        {type === 'success' && <span>✅</span>}
        {type === 'error' && <span>❌</span>}
        {type === 'warning' && <span>⚠️</span>}
        {type === 'info' && <span>ℹ️</span>}
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Toast;
