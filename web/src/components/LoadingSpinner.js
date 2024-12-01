import React from 'react';

const LoadingSpinner = ({ fullScreen = false }) => {
  const spinnerClasses = "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500";
  const containerClasses = fullScreen 
    ? "flex items-center justify-center min-h-screen bg-gray-50"
    : "flex items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses}></div>
    </div>
  );
};

export default LoadingSpinner;
