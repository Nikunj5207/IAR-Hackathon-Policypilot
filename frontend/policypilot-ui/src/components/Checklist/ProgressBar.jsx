import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div 
        className="bg-gold h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
