import React from 'react';
import { getStockStatus } from '../../utils/formatters';

const StockBadge = ({ stockQuantity, minThreshold = 5 }) => {
  const { label, color, dotColor } = getStockStatus(stockQuantity, minThreshold);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-none ${dotColor}`} />
      <span>{label}</span>
      <span className="font-mono opacity-90">({stockQuantity})</span>
    </span>
  );
};

export default StockBadge;