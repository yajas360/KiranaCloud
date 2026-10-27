import React, { useState } from 'react';
import { Store, Phone, MapPin, Percent, DollarSign, Check, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateProfile, currencySymbol } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    storeName: user?.storeName || '',
    storePhone: user?.storePhone || '',
    storeAddress: user?.storeAddress || '',
    taxRate: user?.taxRate || 5,
    currency: user?.currency || 'INR',
    currencySymbol: user?.currencySymbol || '₹',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      setLoading(true);
      const res = await api.patch('/auth/profile', formData);
      if (res.data.success) {
        updateProfile(res.data.data);
        setSuccessMsg('Store terminal settings saved successfully.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update store settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Store & POS Settings</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure business details printed on digital invoices and POS receipts.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-none border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
        {successMsg && (
          <div className="p-3.5 rounded-none bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Store Owner Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
              Store / Business Name (Printed on Receipt Header)
            </label>
            <div className="relative">
              <Store className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2 text-xs rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Store Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Default GST / Tax Rate (%)</label>
              <div className="relative">
                <Percent className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  step="0.5"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Store Address</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t-2 border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider border border-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Store Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;