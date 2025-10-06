import React, { useState, useEffect } from 'react';

const TimerDisplay = ({ orderId, timerStatus, onTimerExpired }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (timerStatus && timerStatus.isActive) {
      setIsActive(true);
      setRemainingTime(timerStatus.remainingTime);

      const interval = setInterval(() => {
        const newRemaining = Math.max(0, timerStatus.remainingTime - 1000);
        setRemainingTime(newRemaining);

        if (newRemaining <= 0) {
          setIsActive(false);
          if (onTimerExpired) {
            onTimerExpired(orderId);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsActive(false);
      setRemainingTime(0);
    }
  }, [timerStatus, orderId, onTimerExpired]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!timerStatus || !timerStatus.startTime || !timerStatus.endTime) return 0;
    const totalDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const elapsed = totalDuration - remainingTime;
    return Math.min(100, (elapsed / totalDuration) * 100);
  };

  if (!timerStatus || !timerStatus.isActive) {
    return null;
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
