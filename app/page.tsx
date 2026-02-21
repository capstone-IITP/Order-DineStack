"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Utensils, Loader2, Check, Lock, ScanLine, Camera, WifiOff, X, User, Phone, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

// New Imports
// CartProvider removed from here as it is now in layout.tsx
// CartDrawer & FloatingCartButton removed (in layout.tsx)
import MenuList from '@/components/menu/MenuList';
import ItemDetailModal from '@/components/menu/ItemDetailModal';

// Shared Data & Types
import { MENU_DATA, CATEGORIES } from '@/data/menu';
import { MenuItem } from '@/types';

// --- Configuration ---
const IS_RESTAURANT_OPEN = true;

// --- Types ---
interface Session {
  restaurantId: string;
  tableId: string;
}

// --- Verification & Helper Functions ---
const isValidIdentity = () => {
  if (typeof window === 'undefined') return false;
  const name = localStorage.getItem('dinestack_customer_name');
  const phone = localStorage.getItem('dinestack_customer_phone');
  return !!(name && name.trim().length >= 2 && phone && /^\d{10}$/.test(phone.trim()));
};

const ClosedView = () => (
  <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto h-full p-6 animate-fade-in text-center bg-white/50 backdrop-blur-sm">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <Lock className="w-10 h-10 text-gray-500" />
    </div>
    <h2 className="text-3xl font-serif-custom font-bold text-[#5A0528] mb-2">We Are Closed</h2>
    <p className="text-gray-600 mb-8 max-w-xs">We are currently not accepting orders. Please check back later.</p>
  </div>
);

const LandingView = ({ onComplete }: { onComplete: () => void }) => {
  const [status, setStatus] = useState('idle');

  const handleOrder = () => {
    if (status !== 'idle') return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-md mx-auto h-full p-4 sm:p-6 relative z-10">
      <div className="flex-1 flex flex-col items-center pt-16 animate-fade-in">
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 border border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-2 border border-white/40 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden">
            <img src="/assets/DineStack Bg Remove.png" alt="DineStack Logo" className="w-16 h-16 object-contain" />
          </div>
        </div>
        <h1 className="font-sans text-5xl font-extrabold text-white text-center leading-tight tracking-tighter drop-shadow-2xl mb-2">Dine<span className="text-[#B01E58]">Stack</span></h1>
        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent my-4"></div>
        <p className="text-white/90 text-sm tracking-[0.3em] uppercase font-bold">Smart Dining Solutions</p>
      </div>
      <div className="w-full pb-8 animate-slide-up">
        <div className="glass-panel rounded-[2.5rem] p-8 flex flex-col items-center space-y-7 transform transition-all hover:scale-[1.01] duration-500 shadow-2xl border border-white/40">
          <div className="flex flex-col items-center text-center space-y-2 mb-2">
            <h3 className="text-[#5A0528] font-black text-2xl tracking-tight">Welcome</h3>
            <p className="text-gray-600/80 text-[15px] font-medium leading-relaxed">Experience the future of dining.<br />Tap below to begin.</p>
          </div>
          <button onClick={handleOrder} disabled={status !== 'idle'} className={`w-full text-white rounded-2xl py-5 relative overflow-hidden group shadow-2xl shadow-[#8D0B41]/30 transition-all active:scale-[0.97] ${status === 'loading' ? 'bg-[#5A0528] cursor-wait' : 'bg-[#8D0B41] hover:bg-[#B01E58]'}`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-[#8D0B41] via-[#B01E58] to-[#8D0B41] bg-[length:200%_200%] animate-gradient-xy transition-opacity ${status === 'idle' ? 'opacity-100 group-hover:scale-105' : 'opacity-0'}`}></div>
            <div className="relative flex items-center justify-center space-x-3">
              {status === 'idle' && <><span className="font-bold text-xl tracking-tight">View Menu</span><ChevronRight className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" /></>}
              {status === 'loading' && <><span className="font-bold text-xl tracking-tight">Entering...</span><Loader2 className="w-6 h-6 animate-spin" /></>}
              {status === 'success' && <><span className="font-bold text-xl tracking-tight">Welcome</span><CheckCircle2 className="w-6 h-6 animate-[scale-in_0.3s_ease-out]" /></>}
            </div>
          </button>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-center text-[10px] text-gray-400 font-medium leading-relaxed max-w-[200px]">By continuing, you agree to our <a href="#" className="text-[#8D0B41] underline decoration-[#8D0B41]/30 hover:decoration-[#8D0B41] transition-all">Terms of Service</a></p>
            <div className="h-[1px] w-8 bg-gray-100"></div>
            <div className="flex items-center gap-2 grayscale transition-all hover:grayscale-0 opacity-40 hover:opacity-100 duration-500">
              <span className="text-[9px] tracking-[0.2em] font-black text-black uppercase">Powered by DineStack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScanQRView = ({ onScanSuccess, onCancel }: { onScanSuccess: (rId: string, tId: string) => void, onCancel?: () => void }) => {
  const [permissionError, setPermissionError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    setScanning(true);
    setPermissionError(false);

    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      setTimeout(async () => {
        try {
          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              try {
                const url = new URL(decodedText);
                const params = new URLSearchParams(url.search);
                const rId = params.get('restaurantId');
                const tId = params.get('tableId');

                if (rId && tId) {
                  scanner.stop().then(() => {
                    scannerRef.current = null;
                    onScanSuccess(rId, tId);
                  }).catch(console.error);
                }
              } catch (e) {
                console.error("QR Parse Error", e);
              }
            },
            (errorMessage) => { }
          );
        } catch (innerErr) {
          console.error("Error starting scanner delayed", innerErr);
          setPermissionError(true);
          setScanning(false);
        }
      }, 500);
    } catch (err) {
      console.error("Error starting scanner", err);
      setPermissionError(true);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) { console.error(e); }
    }
    setScanning(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto h-full p-4 animate-fade-in relative z-20">
      <div className="bg-zinc-950/90 backdrop-blur-2xl w-full rounded-[3rem] p-1 flex flex-col items-center relative overflow-hidden shadow-2xl border border-white/10">
        <div className={`w-full p-8 text-center space-y-4 transition-all duration-500 ${scanning ? 'h-0 opacity-0 overflow-hidden p-0' : 'opacity-100'}`}>
          <div className="w-20 h-20 bg-gradient-to-tr from-[#8D0B41] to-[#B01E58] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#8D0B41]/40 rotate-6 transform transition-transform hover:rotate-0">
            <ScanLine className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-[#5A0528] tracking-tight leading-tight">Join the<br />Experience</h2>
          <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">Simply scan the QR code at your table to explore our digital menu.</p>
        </div>

        <div className={`relative w-full transition-all duration-500 overflow-hidden ${scanning ? 'h-[500px] rounded-[2rem]' : 'h-[200px] rounded-3xl bg-gray-50/50'}`}>
          {permissionError && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50 p-6 text-center animate-fade-in">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto"><WifiOff className="w-6 h-6" /></div>
                <p className="text-red-600 font-medium">Camera access denied</p>
                <p className="text-xs text-gray-400">Please enable camera permissions in your browser settings.</p>
                <button onClick={startScanning} className="text-xs font-bold text-[#8D0B41] underline mt-2">Try Again</button>
              </div>
            </div>
          )}

          <div id="reader" className="w-full h-full object-cover rounded-[2rem] overflow-hidden"></div>

          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-[2px] space-y-6 transition-all duration-500 z-20 ${scanning ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            <button
              onClick={startScanning}
              className="group relative px-8 py-4 bg-[#8D0B41] text-white rounded-2xl font-bold shadow-xl shadow-[#8D0B41]/25 hover:shadow-2xl hover:shadow-[#8D0B41]/40 hover:scale-105 active:scale-95 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <div className="relative flex items-center gap-3">
                <Camera className="w-5 h-5" />
                <span className="tracking-wide">Enable Camera</span>
              </div>
            </button>
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center gap-3 w-32 opacity-20">
                <div className="h-[1px] bg-white flex-1"></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">OR</span>
                <div className="h-[1px] bg-white flex-1"></div>
              </div>
              <p className="text-sm font-medium text-white/50">Use your phone's native camera</p>
            </div>
          </div>

          <div className={`absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center transition-opacity duration-1000 ${scanning ? 'opacity-100 delay-500' : 'opacity-0'}`}>
            <div className="relative w-64 h-64 border border-white/20 rounded-3xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#8D0B41] rounded-tl-xl -translate-x-1 -translate-y-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#8D0B41] rounded-tr-xl translate-x-1 -translate-y-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#8D0B41] rounded-bl-xl -translate-x-1 translate-y-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#8D0B41] rounded-br-xl translate-x-1 translate-y-1"></div>
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-laser"></div>
              <div className="absolute -bottom-12 left-0 right-0 text-center">
                <p className="text-white/90 text-sm font-medium tracking-wider shadow-sm backdrop-blur-md bg-black/20 py-1 px-3 rounded-full inline-block">Align QR code within frame</p>
              </div>
            </div>
          </div>

          <div className={`absolute bottom-6 left-0 right-0 flex justify-center z-40 transition-all duration-300 ${scanning ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button
              onClick={stopScanning}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmationView = ({ session, onConfirm, onCancel, onResetIdentity }: { session: Session | null, onConfirm: () => void, onCancel: () => void, onResetIdentity: () => void }) => {
  const [existingName, setExistingName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('dinestack_customer_name');
    if (name) setExistingName(name);
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto h-full p-4 sm:p-6 animate-fade-in relative z-20">
      <div className="glass-panel w-full rounded-[3rem] p-10 flex flex-col items-center space-y-10 relative overflow-hidden shadow-2xl border border-white/50">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#5A0528] via-[#B01E58] to-[#8D0B41]"></div>

        <div className="text-center space-y-3">
          {existingName ? (
            <>
              <h2 className="text-3xl font-black text-[#5A0528] tracking-tight">Welcome back,<br /><span className="text-[#B01E58]">{existingName}</span></h2>
              <div className="flex items-center justify-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] pt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Confirmed Table {session?.tableId}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black text-[#5A0528] tracking-tight">Confirmed!</h2>
              <p className="text-gray-500 font-semibold text-sm">Table {session?.tableId} is reserved for you.</p>
            </>
          )}
        </div>

        <div className="relative group">
          <div className="w-40 h-40 rounded-full border-8 border-white shadow-[0_20px_50px_rgba(141,11,65,0.15)] flex items-center justify-center bg-gradient-to-br from-[#FDF2F6] to-white relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8D0B41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-7xl font-black text-[#8D0B41] tracking-tighter drop-shadow-sm">{session?.tableId || '--'}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white p-3 rounded-2xl shadow-xl shadow-green-500/30 z-20 transform scale-110">
            <Check className="w-6 h-6 stroke-[3px]" />
          </div>
        </div>

        <div className="flex flex-col w-full space-y-4 pt-4">
          <button onClick={onConfirm} className="w-full bg-gradient-to-r from-[#8D0B41] to-[#B01E58] text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-[#8D0B41]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span>{existingName ? "Open Menu" : "Confirm & Start"}</span>
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 bg-transparent text-gray-500 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 transition-colors text-xs">
              Wrong Table?
            </button>
            {existingName && (
              <button onClick={onResetIdentity} className="flex-1 bg-transparent text-[#8D0B41] py-3 rounded-xl border border-[#8D0B41]/20 font-medium hover:bg-[#8D0B41]/5 transition-colors text-xs">
                Not {existingName}?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
};

const CustomerIdentityView = ({ onComplete }: { onComplete: () => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  // Gate: if identity already exists in localStorage, skip immediately
  useEffect(() => {
    if (isValidIdentity()) {
      onComplete();
    }
  }, [onComplete]);

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;
    localStorage.setItem('dinestack_customer_name', name.trim());
    localStorage.setItem('dinestack_customer_phone', phone.trim());
    onComplete();
  };

  useEffect(() => {
    if (submitted) validate();
  }, [name, phone]);

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto h-full animate-fade-in font-sans relative z-20">
      <div className="relative overflow-hidden rounded-b-[4rem] shadow-2xl shadow-[#8D0B41]/20 z-10 bg-[#5A0528] shrink-0 h-56 flex flex-col justify-center items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] via-[#8D0B41] to-[#2E0219]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#B01E58]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative px-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/20 shadow-2xl flex items-center justify-center transform -rotate-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Identity</h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] pt-1">Personalize Your Order</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 -mt-10">
        <form onSubmit={handleSubmit} className="glass-panel rounded-[3rem] p-8 shadow-2xl border border-white/40 space-y-7 relative z-20 animate-slide-up">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#8D0B41] uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <User className="w-3 h-3" />
              Full Name
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className={`w-full px-6 py-5 bg-gray-50/50 rounded-2xl text-base font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all ${errors.name ? 'ring-2 ring-red-300 bg-red-50/30' : 'focus:ring-[#8D0B41]/20 focus:bg-white'}`} />
            {errors.name && (<p className="text-red-500 text-[10px] font-bold ml-2 flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.name}</p>)}
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#8D0B41] uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <Phone className="w-3 h-3" />
              Mobile Number
            </label>
            <input type="tel" value={phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setPhone(val); }} placeholder="10-digit number" className={`w-full px-6 py-5 bg-gray-50/50 rounded-2xl text-base font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'ring-2 ring-red-300 bg-red-50/30' : 'focus:ring-[#8D0B41]/20 focus:bg-white'}`} />
            {errors.phone && (<p className="text-red-500 text-[10px] font-bold ml-2 flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.phone}</p>)}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-[#8D0B41] to-[#B01E58] text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-[#8D0B41]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
            <span>Continue to Menu</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="pt-2 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Secure & Personalized<br />Dining Experience</p>
          </div>
        </form>
      </div>
    </div>
  );
};

function MainContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'landing' | 'scanning' | 'confirm' | 'identity' | 'menu'>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    // Check URL first
    const rId = searchParams.get('restaurantId');
    const tId = searchParams.get('tableId');

    // Check localStorage fallback if not in URL
    const savedSession = typeof window !== 'undefined' ? localStorage.getItem('dinestack_session') : null;

    if (rId && tId) {
      setSession({ restaurantId: rId, tableId: tId });
      // If we have URL params, we can skip scanning and go to confirm directly
      setMode('confirm');
    } else if (savedSession) {
      // Rehydrate session
      setSession(JSON.parse(savedSession));
      // If we have a session AND identity, go to menu? 
      // This logic can be refined. For now, let's stick to flow or go to landing.
      // Changing default mode to landing.
    }
  }, [searchParams]);

  if (!IS_RESTAURANT_OPEN) return <ClosedView />;

  const handleScanSuccess = (rId: string, tId: string) => {
    setSession({ restaurantId: rId, tableId: tId });
    localStorage.setItem('dinestack_session', JSON.stringify({ restaurantId: rId, tableId: tId }));
    setMode('confirm');
  };

  const handleConfirmTable = () => {
    if (isValidIdentity()) {
      setMode('menu');
    } else {
      setMode('identity');
    }
  };

  const handleIdentityComplete = () => {
    setMode('menu');
  };

  const handleResetIdentity = () => {
    localStorage.removeItem('dinestack_customer_name');
    localStorage.removeItem('dinestack_customer_phone');
    // Force re-render/update
    setMode('confirm'); // Will triggering re-render of ConfirmationView
    window.location.reload(); // Simple way to clear state for now
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#5A0528] overflow-hidden text-[#111111] font-sans relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] via-[#8D0B41] to-[#2E0219] opacity-95"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B01E58]/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-[#000]/30 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] mix-blend-overlay"></div>
      </div>

      {mode === 'landing' && (
        <LandingView onComplete={() => session ? setMode('confirm') : setMode('scanning')} />
      )}

      {mode === 'scanning' && (
        <ScanQRView onScanSuccess={handleScanSuccess} onCancel={() => setMode('landing')} />
      )}

      {mode === 'confirm' && (
        <ConfirmationView
          session={session}
          onConfirm={handleConfirmTable}
          onCancel={() => { setSession(null); setMode('scanning'); }}
          onResetIdentity={handleResetIdentity}
        />
      )}

      {mode === 'identity' && (
        <CustomerIdentityView onComplete={handleIdentityComplete} />
      )}

      {mode === 'menu' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in relative">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-xl px-6 py-5 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8D0B41] to-[#5A0528] p-1.5 shadow-md shadow-[#8D0B41]/20">
                <img src="/assets/DineStack Bg Remove.png" alt="DS" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#5A0528]">DineStack</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Table {session?.tableId}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner group active:scale-95 transition-transform">
              <User className="w-5 h-5 text-gray-400 group-hover:text-[#8D0B41] transition-colors" />
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-20">
            <MenuList
              categories={CATEGORIES}
              items={MENU_DATA}
              onItemClick={setSelectedItem}
            />
          </div>

          {/* Cart UI - now in layout.tsx */}

          {/* Item Modal */}
          {selectedItem && (
            <ItemDetailModal
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#8D0B41]" />
      </div>
    }>
      <MainContent />
    </Suspense>
  );
}
