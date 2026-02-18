"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Utensils, Loader2, Check, Lock, ScanLine, Camera, WifiOff, X, User, Phone, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

// New Imports
import { CartProvider } from '@/contexts/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import FloatingCartButton from '@/components/cart/FloatingCartButton';
import MenuList from '@/components/menu/MenuList';
import ItemDetailModal from '@/components/menu/ItemDetailModal';

// Shared Data & Types
import { MENU_DATA, CATEGORIES } from '@/data/menu';
import { MenuItem } from '@/types';

// --- Configuration ---
const IS_RESTAURANT_OPEN = true;
const SIMULATE_NETWORK_ERROR = false;

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

// --- Components (Inline Onboarding) ---
// Kept inline to avoid too many small files, but "Menu" components are now external.

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
    <div className="flex-1 flex flex-col justify-between w-full max-w-md mx-auto h-full p-4 sm:p-6">
      <div className="flex-1 flex flex-col items-center pt-16 animate-fade-in">
        <div className="w-20 h-20 mb-6 relative">
          <div className="absolute inset-0 border border-white/30 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-1 border border-white/50 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(141,11,65,0.3)]">
            <span className="font-serif-custom text-4xl text-white italic">L</span>
          </div>
        </div>
        <h1 className="font-serif-custom text-5xl text-white text-center leading-tight tracking-tight drop-shadow-lg mb-2">Lumière<br /><span className="text-3xl italic opacity-90">Bistro</span></h1>
        <div className="w-12 h-[1px] bg-white/40 my-4"></div>
        <p className="text-white/80 text-sm tracking-widest uppercase font-medium">Fine Digital Dining</p>
      </div>
      <div className="w-full pb-8 animate-slide-up">
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center space-y-6 transform transition-transform hover:scale-[1.02] duration-500">
          <div className="flex flex-col items-center text-center space-y-2 mb-2">
            <h3 className="text-[#5A0528] font-bold text-lg">Welcome</h3>
            <p className="text-gray-600 text-sm">Please tap below to start your dining experience.</p>
          </div>
          <button onClick={handleOrder} disabled={status !== 'idle'} className={`w-full text-white rounded-2xl py-4 relative overflow-hidden group shadow-xl shadow-[#8D0B41]/20 transition-all active:scale-[0.98] ${status === 'loading' ? 'bg-[#5A0528] cursor-wait' : 'bg-[#8D0B41] hover:bg-[#B01E58]'}`}>
            <div className={`absolute inset-0 bg-gradient-to-r from-[#8D0B41] to-[#B01E58] transition-opacity ${status === 'idle' ? 'opacity-100 group-hover:opacity-90' : 'opacity-0'}`}></div>
            <div className="relative flex items-center justify-center space-x-3">
              {status === 'idle' && <><span className="font-medium text-lg tracking-wide">View Menu</span><Utensils className="w-4 h-4 opacity-60 group-hover:rotate-12 transition-transform duration-300" /></>}
              {status === 'loading' && <><span className="font-medium text-lg tracking-wide">Enter</span><Loader2 className="w-5 h-5 animate-spin" /></>}
              {status === 'success' && <><span className="font-medium text-lg tracking-wide">Welcome</span><Check className="w-5 h-5 animate-[scale-in_0.3s_ease-out]" /></>}
            </div>
          </button>
          <p className="text-center text-xs text-gray-500 leading-relaxed">By continuing, you agree to our<br /><a href="#" className="underline decoration-gray-300 hover:text-[#8D0B41] transition-colors">Terms of Service</a></p>
        </div>
        <div className="mt-6 text-center opacity-40 hover:opacity-100 transition-opacity duration-300"><span className="text-[10px] tracking-widest uppercase text-gray-400">Powered by DineStack</span></div>
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
      <div className="glass-panel w-full rounded-[2.5rem] p-1 flex flex-col items-center relative overflow-hidden shadow-2xl border border-white/40">
        <div className={`w-full p-6 text-center space-y-3 transition-all duration-500 ${scanning ? 'h-0 opacity-0 overflow-hidden p-0' : 'opacity-100'}`}>
          <div className="w-16 h-16 bg-gradient-to-tr from-[#8D0B41] to-[#B01E58] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#8D0B41]/30 rotate-3">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-serif-custom font-bold text-[#5A0528] tracking-tight">Begin Your<br />Dining Experience</h2>
          <p className="text-gray-600 text-[15px] leading-relaxed max-w-[260px] mx-auto">Scan the QR code on your table to unlock our digital menu.</p>
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
              <div className="flex items-center gap-3 w-32 opacity-40">
                <div className="h-[1px] bg-black flex-1"></div>
                <span className="text-[10px] font-bold text-black uppercase tracking-widest">OR</span>
                <div className="h-[1px] bg-black flex-1"></div>
              </div>
              <p className="text-sm font-medium text-gray-500">Use your phone's native camera</p>
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
    <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto h-full p-4 sm:p-6 animate-fade-in">
      <div className="glass-panel w-full rounded-3xl p-8 flex flex-col items-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#8D0B41] to-[#B01E58]"></div>

        <div className="text-center space-y-2">
          {existingName ? (
            <>
              <h2 className="text-2xl font-serif-custom text-[#5A0528] italic">Welcome back, {existingName}</h2>
              <p className="text-gray-600 text-sm">Table {session?.tableId} is ready for you.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-serif-custom text-[#5A0528] italic">Welcome to Table {session?.tableId}</h2>
              <p className="text-gray-600 text-sm">Please confirm your table number to proceed.</p>
            </>
          )}
        </div>

        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-[#8D0B41]/10 flex items-center justify-center bg-[#FDF2F6]">
            <span className="text-5xl font-serif-custom text-[#8D0B41] font-bold">{session?.tableId || '--'}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="flex flex-col w-full space-y-3 pt-4">
          <button onClick={onConfirm} className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-medium shadow-lg shadow-[#8D0B41]/20 hover:bg-[#B01E58] active:scale-[0.98] transition-all">
            {existingName ? "Confirm & View Menu" : "Confirm Table"}
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
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto h-full bg-[#f8f9fa] animate-fade-in font-sans">
      <div className="relative overflow-hidden rounded-b-[3rem] shadow-xl shadow-[#8D0B41]/10 z-10 bg-[#5A0528] shrink-0 h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2E0219]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative px-6 flex flex-col justify-center h-full text-center space-y-2">
          <span className="inline-block mx-auto p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg mb-2">
            <User className="w-8 h-8 text-white" />
          </span>
          <h2 className="text-3xl font-serif-custom font-bold text-white leading-tight">Almost There!</h2>
          <p className="text-white/70 text-sm font-medium">Tell us a bit about yourself</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 -mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 space-y-6 relative z-20 animate-slide-up">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
              <User className="w-4 h-4 text-[#8D0B41]" />
              Your Name
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className={`w-full px-5 py-4 bg-gray-50 rounded-2xl text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.name ? 'ring-2 ring-red-300 bg-red-50/30 focus:ring-red-400' : 'focus:ring-[#8D0B41]/20 focus:bg-white'}`} />
            {errors.name && (<p className="text-red-500 text-xs font-medium ml-1 flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.name}</p>)}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#8D0B41]" />
              Phone Number
            </label>
            <input type="tel" value={phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setPhone(val); }} placeholder="10-digit phone number" className={`w-full px-5 py-4 bg-gray-50 rounded-2xl text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'ring-2 ring-red-300 bg-red-50/30 focus:ring-red-400' : 'focus:ring-[#8D0B41]/20 focus:bg-white'}`} />
            {errors.phone && (<p className="text-red-500 text-xs font-medium ml-1 flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.phone}</p>)}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-[#8D0B41] to-[#B01E58] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#8D0B41]/25 hover:shadow-2xl hover:shadow-[#8D0B41]/40 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group">
            <span>Continue to Menu</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-center text-xs text-gray-400 leading-relaxed">Your details help us personalize your experience.<br />We never share your information.</p>
        </form>
      </div>
    </div>
  );
};

export default function Home() {
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
    <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] overflow-hidden text-[#111111] font-sans">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      <CartProvider>
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
            <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100">
              <div>
                <h1 className="text-xl font-serif-custom font-bold text-[#5A0528]">Lumière Bistro</h1>
                <p className="text-xs text-gray-500 font-medium">Table {session?.tableId}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
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

            {/* Cart UI */}
            <FloatingCartButton />
            <CartDrawer />

            {/* Item Modal */}
            {selectedItem && (
              <ItemDetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
            )}
          </div>
        )}
      </CartProvider>
    </div>
  );
}
