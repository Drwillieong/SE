import React from 'react';

const TimerProgressBar = ({ timerStatus, size = 'sm' }) => {
  const getProgressPercentage = () => {
    if (!timerStatus || !timerStatus.startTime || !timerStatus.endTime) return 0;
    const totalDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = new Date();
    const startTime = new Date(timerStatus.startTime);
    const endTime = new Date(timerStatus.endTime);
    const elapsed = now - startTime;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const getTimeRemaining = () => {
    if (!timerStatus || !timerStatus.endTime) return '00:00';
    const now = new Date();
    const endTime = new Date(timerStatus.endTime);
    const remaining = Math.max(0, endTime - now);

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 25) return 'bg-green-500';
    if (percentage < 50) return 'bg-yellow-500';
    if (percentage < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    const percentage = getProgressPercentage();
    if (percentage < 25) return 'On Time';
    if (percentage < 50) return 'Running Late';
    if (percentage < 75) return 'Very Late';
    return 'Overdue';
  };

  if (!timerStatus || !timerStatus.isActive) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="timer-progress-container">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">
          {timerStatus.currentStatus?.charAt(0).toUpperCase() + timerStatus.currentStatus?.slice(1)} Progress
        </span>
        <span className={`text-xs font-medium ${getStatusColor().replace('bg-', 'text-')}`}>
          {getTimeRemaining()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full">
        <div
          className={`transition-all duration-1000 ease-out rounded-full ${getStatusColor()}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500">0%</span>
        <span className={`text-xs font-medium ${getStatusColor().replace('bg-', 'text-')}`}>
          {getStatusText()}
        </span>
        <span className="text-xs text-gray-500">100%</span>
      </div>
    </div>
  );
};

export default TimerProgressBar;
