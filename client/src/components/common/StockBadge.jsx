import React from 'react';
import { getStockStatus } from '../../utils/formatters';

const StockBadge = ({ stockQuantity, minThreshold = 5 }) => {
  const { label, color, dotColor } = getStockStatus(stockQuantity, minThreshold);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
      <span className="font-semibold opacity-80">({stockQuantity})</span>
    </span>
  );
};

export default StockBadge;
