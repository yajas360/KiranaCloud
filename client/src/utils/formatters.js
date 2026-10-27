export const formatCurrency = (amount, currency = 'INR', symbol = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol}0.00`;
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${symbol}${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

export const formatDate = (dateString, formatStr = 'standard') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  if (formatStr === 'time') {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  if (formatStr === 'short') {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  if (formatStr === 'full') {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getStockStatus = (stockQuantity, minThreshold = 5) => {
  if (stockQuantity <= 0) {
    return {
      status: 'OUT_OF_STOCK',
      label: 'Out of Stock',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
    };
  }
  if (stockQuantity <= minThreshold) {
    return {
      status: 'LOW_STOCK',
      label: 'Low Stock',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    status: 'IN_STOCK',
    label: 'In Stock',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  };
};

export const getCategoryColor = (category) => {
  const colors = {
    'Grocery & Staples': 'bg-amber-100 text-amber-800 border-amber-200',
    'Dairy & Bakery': 'bg-blue-100 text-blue-800 border-blue-200',
    'Beverages & Juices': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Snacks & Packaged Foods': 'bg-orange-100 text-orange-800 border-orange-200',
    'Personal Care': 'bg-purple-100 text-purple-800 border-purple-200',
    'Household & Cleaning': 'bg-teal-100 text-teal-800 border-teal-200',
    'Fruits & Vegetables': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Stationery & General': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Other': 'bg-slate-100 text-slate-800 border-slate-200',
  };
  return colors[category] || 'bg-slate-100 text-slate-800 border-slate-200';
};

export const formatUnit = (unit) => {
  if (!unit) return 'pcs';
  const lower = String(unit).trim().toLowerCase();
  if (lower === 'liter' || lower === 'litre' || lower === 'ltr' || lower === 'litres' || lower === 'l') {
    return 'litres';
  }
  return unit;
};
