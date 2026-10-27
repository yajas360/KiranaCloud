import React from 'react';

const LoadingSpinner = ({ text = 'Loading records...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-2.5">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-zinc-300 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-500 animate-spin`}
      />
      {text && <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;