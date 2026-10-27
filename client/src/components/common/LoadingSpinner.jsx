import React from 'react';

const LoadingSpinner = ({ text = 'Loading records...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-2.5">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-slate-200 border-t-emerald-600 animate-spin`}
      />
      {text && <p className="text-xs font-semibold text-slate-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
