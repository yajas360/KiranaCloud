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
      color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      dotColor: 'bg-rose-500',
    };
  }
  if (stockQuantity <= minThreshold) {
    return {
      status: 'LOW_STOCK',
      label: 'Low Stock',
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    status: 'IN_STOCK',
    label: 'In Stock',
    color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  };
};

export const getCategoryColor = (category) => {
  const colors = {
    'Grocery & Staples': 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    'Dairy & Bakery': 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    'Beverages & Juices': 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    'Snacks & Packaged Foods': 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    'Personal Care': 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    'Household & Cleaning': 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    'Fruits & Vegetables': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    'Stationery & General': 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    'Other': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
  };
  return colors[category] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
};

export const formatUnit = (unit) => {
  if (!unit) return 'pcs';
  const lower = String(unit).trim().toLowerCase();
  if (lower === 'liter' || lower === 'litre' || lower === 'ltr' || lower === 'litres' || lower === 'l') {
    return 'litres';
  }
  return unit;
};
