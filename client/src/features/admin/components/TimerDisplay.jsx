import React, { useState, useEffect } from 'react';

const TimerDisplay = ({ orderId, timerStatus, onTimerExpired }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (timerStatus && timerStatus.isActive) {
      const calculateRemaining = () => {
        const elapsed = Date.now() - timerStatus.startTime;
        const newRemaining = Math.max(0, timerStatus.duration - elapsed);
        setRemainingTime(newRemaining);
        setIsActive(newRemaining > 0);

        if (newRemaining <= 0 && onTimerExpired) {
          onTimerExpired(orderId);
        }
      };

      calculateRemaining(); // Initial calculation
      const interval = setInterval(() => {
        calculateRemaining();
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsActive(false);
      setRemainingTime(0);
    }
  }, [timerStatus, orderId]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!timerStatus || !timerStatus.duration || remainingTime === 0) return 100;
    const elapsed = timerStatus.duration - remainingTime;
    return Math.min(100, (elapsed / timerStatus.duration) * 100);
  };

  if (!isActive) {
    return null; // Don't render if timer is not active or has expired
  }

  return (
    <div className="timer-display">
      <div className="flex items-center space-x-2">
        <div className="text-sm font-mono text-blue-600">
          {formatTime(remainingTime)}
        </div>
        <div className="w-16 h-1 bg-gray-200 rounded">
          <div
            className="h-full bg-blue-500 rounded transition-all duration-1000"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
