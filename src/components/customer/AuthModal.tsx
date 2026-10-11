import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LOCALITIES } from '../../data/initialData';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Building,
  Sparkles
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    currentLocality,
    setCurrentLocality,
    setCurrentPage,
    setCurrentRole,
    customers,
    showToast
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLocality, setRegLocality] = useState(currentLocality || LOCALITIES[0]);
  const [regAddress, setRegAddress] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter your mobile number or email', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      showToast(`Verification code sent to ${loginInput}`, 'info');
    }, 400);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter mobile number or email', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const success = loginCustomer(loginInput, loginOtp);
      if (success) {
        setIsAuthModalOpen(false);
        setOtpSent(false);
        setLoginInput('');
        setLoginOtp('');
      }
    }, 300);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      showToast('Name and mobile number are required', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      registerCustomer({
        name: regName,
        phone: regPhone,
        email: regEmail,
        locality: regLocality,
        address: regAddress
      });
      setIsAuthModalOpen(false);
      // reset form
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
    }, 300);
  };

  const handleQuickDemoSelect = (customer: typeof customers[0]) => {
    loginCustomer(customer.phone);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden animate-scaleUp">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b6efd1] text-[#003523] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {currentUser ? 'Customer Account' : mode === 'login' ? 'Customer Sign In' : 'Create Resident Account'}
              </h2>
              <p className="text-[11px] text-[#b6efd1]/90">
                UrbanCare Solution · Your Space | Our Care
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* IF ALREADY LOGGED IN: SHOW PROFILE CARD & ACTIONS */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#003523] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#131b2e] flex items-center space-x-1.5">
                        <span>{currentUser.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#c0edd3] text-[#003523]">
                          {currentUser.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-[#707973]">{currentUser.phone}</p>
                      {currentUser.email && (
                        <p className="text-[11px] text-[#707973]">{currentUser.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#c0c9c2]/40 text-xs space-y-1 text-[#404943]">
                  <div className="flex items-center space-x-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                    <span className="truncate">{currentUser.address || currentUser.locality}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                    <span>Verified Doorstep Coverage in {currentUser.locality}</span>
                  </div>
                </div>
              </div>

              {/* Account Quick Shortcuts */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentRole('customer');
                    setCurrentPage('account');
                    setIsAuthModalOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                >
                  <User className="w-4 h-4" />
                  <span>Go to My Bookings & Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    logoutCustomer();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>

              {/* Switch Demo Persona Quick Bar */}
              <div className="pt-2 border-t border-[#c0c9c2]/40">
                <p className="text-[11px] font-bold text-[#707973] mb-2 uppercase tracking-wider">
                  Or Switch Resident Account:
                </p>
                <div className="space-y-1.5">
                  {customers.slice(0, 3).map((cust) => (
                    <button
                      key={cust.id}
                      onClick={() => handleQuickDemoSelect(cust)}
                      className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between border transition-all ${
                        cust.id === currentUser.id
                          ? 'bg-[#c0edd3]/40 border-[#003523] font-bold text-[#003523]'
                          : 'bg-white border-[#c0c9c2]/50 hover:bg-[#f2f3ff] text-[#131b2e]'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold">{cust.name}</span>
                        <span className="text-[11px] text-[#707973] ml-2 font-normal">
                          {cust.phone} · {cust.locality.split(',')[0]}
                        </span>
                      </div>
                      {cust.id === currentUser.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                      ) : (
                        <span className="text-[10px] text-[#707973]">Select</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* IF LOGGED OUT: LOGIN & REGISTER TABS */
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-[#f2f3ff] p-1 border border-[#c0c9c2]/40">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setOtpSent(false);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  Sign In (OTP / Phone)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  New Resident Registration
                </button>
              </div>

              {/* LOGIN TAB */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Mobile Number or Email
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder="e.g. 98721 99120 or email"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                      />
                    </div>
                    <p className="text-[11px] text-[#707973] mt-1">
                      Enter your registered 10-digit Punjab mobile number.
                    </p>
                  </div>

                  {otpSent ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#131b2e]">
                          6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] text-[#003523] font-semibold hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          maxLength={6}
                          value={loginOtp}
                          onChange={(e) => setLoginOtp(e.target.value)}
                          placeholder="Auto-filled: 123456"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523] tracking-widest"
                        />
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Demo OTP auto-approved for Kharar residents.</span>
                      </p>
                    </div>
                  ) : null}

                  {/* Primary CTA */}
                  {!otpSent ? (
                    <button
                      type="button"
                      disabled={isLoading || !loginInput.trim()}
                      onClick={handleSendOtp}
                      className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                    >
                      {isLoading ? (
                        <span>Sending Code...</span>
                      ) : (
                        <>
                          <span>Get OTP / Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                    >
                      {isLoading ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Log In</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Quick One-Click Demo Residents */}
                  <div className="pt-3 border-t border-[#c0c9c2]/40">
                    <p className="text-[11px] font-bold text-[#707973] mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Quick Test with Verified Resident:</span>
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {customers.slice(0, 3).map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleQuickDemoSelect(cust)}
                          className="w-full p-2 rounded-lg bg-[#faf8ff] hover:bg-[#e2e7ff] border border-[#c0c9c2]/40 text-left text-xs flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="font-bold text-[#131b2e] group-hover:text-[#003523]">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-[#707973]">
                              {cust.phone} · {cust.locality.split(',')[0]}
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-[#003523]">
                            Login →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* REGISTRATION TAB */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. 98150 12345"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. gsingh@gmail.com"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Select Tricity Sector Hub *
                    </label>
                    <select
                      value={regLocality}
                      onChange={(e) => setRegLocality(e.target.value)}
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    >
                      {LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      House / Flat / Street Address
                    </label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="e.g. House 54, Sector 125, Kharar"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !regName.trim() || !regPhone.trim()}
                    className="w-full py-2.5 mt-2 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                  >
                    {isLoading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Register & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Trust Banner at bottom */}
          <div className="pt-2 border-t border-[#c0c9c2]/40 text-center">
            <p className="text-[10px] text-[#707973] flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-[#003523]" />
              <span>Safe local data policy · Verified Kharar dispatch center</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
