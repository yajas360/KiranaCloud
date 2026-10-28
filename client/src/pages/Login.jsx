import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleQuickFillDemo = (method = 'phone') => {
    setLoginMethod(method);
    setIdentifier(method === 'phone' ? '9811234567' : 'owner@kiranacloud.com');
    setPassword('password123');
    setError(null);
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    if (loginMethod === 'phone') {
      const onlyDigits = val.replace(/\D/g, '').slice(0, 10);
      setIdentifier(onlyDigits);
    } else {
      setIdentifier(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (loginMethod === 'phone' && (identifier.length !== 10 || !/^\d{10}$/.test(identifier))) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    if (!identifier.trim()) {
      setError(`Please enter your ${loginMethod === 'phone' ? '10-digit phone number' : 'email address'}.`);
      return;
    }

    if (!password.trim()) {
      setError('Password cannot consist only of spaces.');
      return;
    }

    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking KiranaCloud session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">KiranaCloud</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Store Staff Authentication</h2>
        <p className="text-xs text-slate-500 mt-1">Access your POS billing counter and inventory</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-6 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Segmented Auth Mode Switch (Sign In vs Register Store) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <Link
              to="/login"
              className="flex-1 py-2 text-center rounded-lg bg-white text-emerald-600 shadow-xs font-bold transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex-1 py-2 text-center rounded-lg text-slate-500 hover:text-slate-900 transition"
            >
              Register Store
            </Link>
          </div>

          {/* Quick Demo Credentials Assistant */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold flex items-center gap-1.5 text-[11px] text-emerald-900">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Demo Store Credentials
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('phone')}
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-md transition active:scale-95 shadow-xs"
                >
                  Fill Mobile
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('email')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200 transition active:scale-95"
                >
                  Fill Email
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 flex flex-col gap-0.5">
              <div>
                <span className="font-semibold text-slate-700">Mobile:</span>{' '}
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('phone')}
                  className="bg-emerald-100/70 hover:bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[10px] font-semibold transition"
                >
                  9811234567
                </button>{' '}
                <span className="text-slate-400">|</span>{' '}
                <span className="font-semibold text-slate-700">Email:</span>{' '}
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('email')}
                  className="bg-emerald-100/70 hover:bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[10px] font-semibold transition"
                >
                  owner@kiranacloud.com
                </button>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Password:</span>{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[10px]">
                  password123
                </code>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Login Method Toggle (Mobile vs Email) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {loginMethod === 'phone' ? '10-Digit Mobile Number' : 'Email Address'}
                </label>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('phone');
                      setIdentifier('');
                      setError(null);
                    }}
                    className={`px-2.5 py-0.5 rounded-md transition ${
                      loginMethod === 'phone'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('email');
                      setIdentifier('');
                      setError(null);
                    }}
                    className={`px-2.5 py-0.5 rounded-md transition ${
                      loginMethod === 'email'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              <div className="relative">
                {loginMethod === 'phone' ? (
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                ) : (
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                )}
                <input
                  type={loginMethod === 'phone' ? 'tel' : 'email'}
                  required
                  maxLength={loginMethod === 'phone' ? 10 : 100}
                  placeholder={loginMethod === 'phone' ? 'e.g. 9811234567' : 'e.g. owner@kiranacloud.com'}
                  value={identifier}
                  onChange={handleIdentifierChange}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password (e.g. password123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 transition shadow-sm disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Need to register a new store?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
              Register Store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
