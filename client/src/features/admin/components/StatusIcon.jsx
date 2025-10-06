import React from 'react';

const StatusIcon = ({ status, isClickable = false, onClick, isLoading = false }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'washing': return '💧';
      case 'drying': return '🌬️';
      case 'folding': return '👔';
      case 'ready': return '✅';
      case 'completed': return '🏁';
      default: return '📦';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 hover:text-yellow-700';
      case 'washing': return 'text-blue-600 hover:text-blue-700';
      case 'drying': return 'text-purple-600 hover:text-purple-700';
      case 'folding': return 'text-indigo-600 hover:text-indigo-700';
      case 'ready': return 'text-green-600 hover:text-green-700';
      case 'completed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleClick = () => {
    if (isClickable && onClick && !isLoading) {
      onClick();
    }
  };

  const baseClasses = `inline-flex items-center justify-center w-8 h-8 rounded-full text-lg transition-all duration-200 ${
    isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-md' : 'cursor-default'
  } ${getStatusColor(status)}`;

  const loadingClasses = isLoading ? 'animate-pulse opacity-50' : '';

  return (
    <div
      className={`${baseClasses} ${loadingClasses}`}
      onClick={handleClick}
      title={isClickable ? `Click to advance to next status` : status}
    >
      {isLoading ? '⏳' : getStatusIcon(status)}
    </div>
  );
};

export default StatusIcon;
