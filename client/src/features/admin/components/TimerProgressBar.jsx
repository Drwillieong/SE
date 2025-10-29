import React, { useState, useEffect } from 'react';

const TimerProgressBar = ({ timerStatus, size = 'sm' }) => {
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (timerStatus && timerStatus.isActive) {
      const calculateRemaining = () => {
        const elapsed = Date.now() - timerStatus.startTime;
        const newRemaining = Math.max(0, timerStatus.duration - elapsed);
        setRemainingTime(newRemaining);
      };

      calculateRemaining();
      const interval = setInterval(calculateRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [timerStatus]);

  const getProgressPercentage = () => {
    if (!timerStatus || !timerStatus.duration) return 0;
    const elapsed = timerStatus.duration - remainingTime;
    return Math.min(100, (elapsed / timerStatus.duration) * 100);
  };

  const getStatusColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 25) return 'bg-green-500';
    if (percentage < 50) return 'bg-yellow-500';
    if (percentage < 75) return 'bg-orange-500';
    return 'bg-red-500';
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
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-1000 ease-out rounded-full ${getStatusColor()}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
    </div>
  );
};

export default TimerProgressBar;
