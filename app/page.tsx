"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Utensils, Loader2, Check, CheckCircle2, Search, Filter, ChevronRight, Star, Leaf, Plus, Minus, X, ShoppingBag, ArrowLeft, Trash2, AlertCircle, Clock, ChefHat, Bell, WifiOff, Lock, RefreshCw, Send, ScanLine, Camera, Smartphone } from 'lucide-react';

// --- Configuration ---
const IS_RESTAURANT_OPEN = true; // Toggle this to test "Closed" state
const SIMULATE_NETWORK_ERROR = false; // Toggle to test network errors (10% chance if false, forced if true)

// --- Types ---
type Category = 'Starters' | 'Mains' | 'Desserts' | 'Drinks';
type OrderStatus = 'received' | 'preparing' | 'ready' | 'served';

interface Option {
  id: string;
  name: string;
  priceModifier: number;
}

interface OptionGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: Option[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image?: string;
  isVeg: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  isAvailable: boolean;
  customizationGroups?: OptionGroup[];
}

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  finalPrice: number;
  quantity: number;
  selectedOptions: Record<string, Option[]>;
  instructions: string;
}

interface ActiveOrder {
  orderId: string;
  items: CartItem[];
  status: OrderStatus;
  timestamp: number;
  totalAmount: number;
  feedbackSubmitted?: boolean;
}

// --- Mock Data ---
const MENU_DATA: MenuItem[] = [
  {
    id: '1',
    name: 'Truffle Mushroom Risotto',
    description: 'Creamy arborio rice with woodland mushrooms, finished with truffle oil and parmesan.',
    price: 24,
    category: 'Mains',
    isVeg: true,
    isPopular: true,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'cheese',
        name: 'Choice of Cheese',
        minSelection: 1,
        maxSelection: 1,
        options: [
          { id: 'parm', name: 'Parmesan', priceModifier: 0 },
          { id: 'pecorino', name: 'Pecorino Romano', priceModifier: 1 },
          { id: 'vegan', name: 'Vegan Cheese', priceModifier: 2 },
        ]
      },
      {
        id: 'extras',
        name: 'Enhancements',
        minSelection: 0,
        maxSelection: 2,
        options: [
          { id: 'oil', name: 'Extra Truffle Oil', priceModifier: 3 },
          { id: 'mushrooms', name: 'Extra Wild Mushrooms', priceModifier: 5 }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Pan-Seared Scallops',
    description: 'Jumbo scallops with cauliflower purée and crispy pancetta.',
    price: 18,
    category: 'Starters',
    isVeg: false,
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Spicy Thai Basil Chicken',
    description: 'Minced chicken stir-fried with thai basil, chili, and garlic found over jasmine rice.',
    price: 20,
    category: 'Mains',
    isVeg: false,
    isSpicy: true,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'spice',
        name: 'Spice Level',
        minSelection: 1,
        maxSelection: 1,
        options: [
          { id: 'mild', name: 'Mild', priceModifier: 0 },
          { id: 'med', name: 'Medium', priceModifier: 0 },
          { id: 'hot', name: 'Hot', priceModifier: 0 },
          { id: 'thai', name: 'Thai Hot 🌶️', priceModifier: 0 },
        ]
      },
      {
        id: 'egg',
        name: 'Add Egg',
        minSelection: 0,
        maxSelection: 1,
        options: [
          { id: 'fried_egg', name: 'Crispy Fried Egg', priceModifier: 2 }
        ]
      }
    ]
  },
  {
    id: '4',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center, served with vanilla bean ice cream.',
    price: 12,
    category: 'Desserts',
    isVeg: true,
    isPopular: true,
    isAvailable: false,
  },
  {
    id: '5',
    name: 'Artisan Burrata',
    description: 'Fresh burrata cheese with heirloom tomatoes, basil pesto, and balsamic glaze.',
    price: 16,
    category: 'Starters',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: '6',
    name: 'Signature Old Fashioned',
    description: 'Bourbon, smoked maple syrup, angostura bitters, orange peel.',
    price: 15,
    category: 'Drinks',
    isVeg: true,
    isAvailable: true,
  },
];

const CATEGORIES: Category[] = ['Starters', 'Mains', 'Desserts', 'Drinks'];
// const TABLE_ID = 'table_12'; // Removed hardcoded ID

// --- Types ---
interface Session {
  restaurantId: string;
  tableId: string;
}

// --- Helper Functions ---
const formatOptions = (selectedOptions: Record<string, Option[]>) => {
  return Object.values(selectedOptions).flat().map(o => o.name).join(', ');
};

const getStatusIndex = (status: OrderStatus) => {
  const statuses: OrderStatus[] = ['received', 'preparing', 'ready', 'served'];
  return statuses.indexOf(status);
};

const validateSession = async (restaurantId: string, tableId: string): Promise<boolean> => {
  // Mock validation - in real app this would hit the backend
  return new Promise(resolve => {
    setTimeout(() => {
      // Accept any IDs for now, or specific ones for testing
      // For now, always valid if present
      resolve(true);
    }, 800);
  });
};

// --- Components ---

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
          {/* Removed Table Verification Badge here as it's not yet needed in landing */}
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

      // Delay starting scanner until expansion animation completes (500ms)
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

      {/* Main Glass Panel */}
      <div className="glass-panel w-full rounded-[2.5rem] p-1 flex flex-col items-center relative overflow-hidden shadow-2xl border border-white/40">

        {/* Header Section (Only visible when not scanning or overlaying) */}
        <div className={`w-full p-6 text-center space-y-3 transition-all duration-500 ${scanning ? 'h-0 opacity-0 overflow-hidden p-0' : 'opacity-100'}`}>
          <div className="w-16 h-16 bg-gradient-to-tr from-[#8D0B41] to-[#B01E58] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#8D0B41]/30 rotate-3">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-serif-custom font-bold text-[#5A0528] tracking-tight">Begin Your<br />Dining Experience</h2>
          <p className="text-gray-600 text-[15px] leading-relaxed max-w-[260px] mx-auto">Scan the QR code on your table to unlock our digital menu.</p>
        </div>

        {/* Camera Container */}
        <div className={`relative w-full transition-all duration-500 overflow-hidden ${scanning ? 'h-[500px] rounded-[2rem]' : 'h-[200px] rounded-3xl bg-gray-50/50'}`}>

          {/* Permission Error */}
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

          {/* Actual Camera Feed */}
          {/* Actual Camera Feed */}
          <div id="reader" className="w-full h-full object-cover rounded-[2rem] overflow-hidden"></div>

          {/* Call to Action (Transition Group) */}
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

          {/* Viewfinder Overlay (Scanning) */}
          <div className={`absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center transition-opacity duration-1000 ${scanning ? 'opacity-100 delay-500' : 'opacity-0'}`}>
            {/* Scanning Frame with Shadow Hole */}
            <div className="relative w-64 h-64 border border-white/20 rounded-3xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
              {/* Corner Markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#8D0B41] rounded-tl-xl -translate-x-1 -translate-y-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#8D0B41] rounded-tr-xl translate-x-1 -translate-y-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#8D0B41] rounded-bl-xl -translate-x-1 translate-y-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#8D0B41] rounded-br-xl translate-x-1 translate-y-1"></div>

              {/* Laser */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-laser"></div>

              <div className="absolute -bottom-12 left-0 right-0 text-center">
                <p className="text-white/90 text-sm font-medium tracking-wider shadow-sm backdrop-blur-md bg-black/20 py-1 px-3 rounded-full inline-block">Align QR code within frame</p>
              </div>
            </div>
          </div>

          {/* Cancel Button (Scanning) */}
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

      {!scanning && (
        <div className="mt-8 text-center opacity-60">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5A0528]">Powered by DineStack</p>
        </div>
      )}
    </div>
  );
};

const ConfirmationView = ({ session, onConfirm, onCancel }: { session: Session | null, onConfirm: () => void, onCancel: () => void }) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto h-full p-4 sm:p-6 animate-fade-in">
      <div className="glass-panel w-full rounded-3xl p-8 flex flex-col items-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#8D0B41] to-[#B01E58]"></div>
        <div className="text-center space-y-2"><h2 className="text-2xl font-serif-custom text-[#5A0528] italic">Welcome to Table {session?.tableId}</h2><p className="text-gray-600 text-sm">Please confirm your table number to proceed.</p></div>
        <div className="relative"><div className="w-32 h-32 rounded-full border-4 border-[#8D0B41]/10 flex items-center justify-center bg-[#FDF2F6]"><span className="text-5xl font-serif-custom text-[#8D0B41] font-bold">{session?.tableId || '--'}</span></div><div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg"><Check className="w-5 h-5" /></div></div>
        <div className="flex flex-col w-full space-y-3 pt-4">
          <button onClick={onConfirm} className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-medium shadow-lg shadow-[#8D0B41]/20 hover:bg-[#B01E58] active:scale-[0.98] transition-all">Confirm & View Menu</button>
          <button onClick={onCancel} className="w-full bg-transparent text-[#8D0B41] py-3 rounded-xl border border-[#8D0B41]/20 font-medium hover:bg-[#8D0B41]/5 transition-colors">Not My Table</button>
        </div>
      </div>
    </div>
  )
}

const MenuItemCard = ({ item, onClick }: { item: MenuItem; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50 transition-all duration-300 ${item.isAvailable ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1' : 'opacity-60 grayscale cursor-not-allowed'
        }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {item.isVeg ? (
              <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-[4px] border border-green-600 top-0.5 relative">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
              </span>
            ) : (
              <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-[4px] border border-red-600 top-0.5 relative">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
              </span>
            )}
            <h4 className="font-serif-custom text-lg font-bold text-gray-900 leading-tight group-hover:text-[#8D0B41] transition-colors">{item.name}</h4>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>

          <div className="flex items-center gap-3 pt-2">
            <span className="font-semibold text-lg text-gray-900">${item.price}</span>
            {item.isPopular && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Popular
              </span>
            )}
            {item.isSpicy && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Spicy</span>
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            disabled={!item.isAvailable}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${item.isAvailable
              ? 'bg-gray-50 text-[#8D0B41] group-hover:bg-[#8D0B41] group-hover:text-white group-hover:shadow-md group-hover:scale-110'
              : 'bg-gray-100 text-gray-300'
              }`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ItemDetailModal = ({ item, onClose, onAddToCart }: { item: MenuItem, onClose: () => void, onAddToCart: (cartItem: CartItem) => void }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Option[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const calculateTotal = useMemo(() => {
    let total = item.price;
    Object.values(selectedOptions).flat().forEach(opt => total += opt.priceModifier);
    return total * quantity;
  }, [item.price, selectedOptions, quantity]);

  const isValid = useMemo(() => {
    if (!item.customizationGroups) return true;
    return item.customizationGroups.every(group => {
      const currentSelection = selectedOptions[group.id] || [];
      return currentSelection.length >= group.minSelection && currentSelection.length <= group.maxSelection;
    });
  }, [item.customizationGroups, selectedOptions]);

  const handleOptionToggle = (group: OptionGroup, option: Option) => {
    setSelectedOptions(prev => {
      const current = prev[group.id] || [];
      const isSelected = current.some(o => o.id === option.id);
      if (group.maxSelection === 1) { // Radio
        return { ...prev, [group.id]: [option] };
      } else { // Checkbox
        if (isSelected) return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
        if (current.length < group.maxSelection) return { ...prev, [group.id]: [...current, option] };
        return prev;
      }
    });
  };

  const handleAdd = () => {
    if (!isValid) return;
    const newItem: CartItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      menuItemId: item.id,
      name: item.name,
      basePrice: item.price,
      finalPrice: calculateTotal / quantity,
      quantity,
      selectedOptions,
      instructions
    };
    onAddToCart(newItem);
    handleClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} style={{ pointerEvents: 'auto' }}></div>
      <div
        className={`bg-white w-full max-w-lg h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl transform transition-transform duration-300 pointer-events-auto ${isClosing ? 'translate-y-full' : 'translate-y-0 animate-slide-up-spring'}`}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden rounded-t-3xl h-48 sm:h-56">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2b0213]"></div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

          <button
            onClick={handleClose}
            className="absolute top-4 left-4 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            <h2 className="text-3xl font-serif-custom font-bold leading-tight mb-2 drop-shadow-sm">{item.name}</h2>
            <div className="flex items-center gap-3 text-sm font-medium opacity-90">
              <span className="bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/10">${item.price}</span>
              {item.isVeg && <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-green-300" /> Vegetarian</span>}
              {item.isSpicy && <span className="flex items-center gap-1.5">🌶️ Spicy</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 text-[15px] leading-relaxed">{item.description}</p>
          </div>

          {item.customizationGroups?.map(group => (
            <div key={group.id} className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
                <span className="text-xs font-bold text-[#8D0B41] bg-[#8D0B41]/5 px-2 py-1 rounded-md uppercase tracking-wide">
                  {group.minSelection > 0 ? 'Required' : 'Optional'}
                </span>
              </div>
              <div className="space-y-2.5">
                {group.options.map(opt => {
                  const isSelected = (selectedOptions[group.id] || []).some(o => o.id === opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group ${isSelected
                        ? 'border-[#8D0B41] bg-[#FDF2F6]'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${group.maxSelection === 1
                          ? isSelected ? 'border-4 border-[#8D0B41] bg-white' : 'border-2 border-gray-300 bg-white'
                          : isSelected ? 'bg-[#8D0B41] text-white' : 'bg-gray-200 text-transparent'
                          }`}>
                          {group.maxSelection !== 1 && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-[15px] font-medium transition-colors ${isSelected ? 'text-[#8D0B41]' : 'text-gray-700'}`}>{opt.name}</span>
                      </div>
                      {opt.priceModifier > 0 && (
                        <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700">+{opt.priceModifier}</span>
                      )}
                      <input
                        type={group.maxSelection === 1 ? "radio" : "checkbox"}
                        className="hidden"
                        name={group.id}
                        checked={isSelected}
                        onChange={() => handleOptionToggle(group, opt)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Special Instructions</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Allergies, extra sauce, etc..."
              className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8D0B41]/20 focus:bg-white transition-all resize-none h-28"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-6 hover:pb-6 transition-all">
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex items-center bg-gray-100 rounded-2xl p-1.5 shrink-0">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-[#8D0B41] active:scale-95 transition-all"><Minus className="w-5 h-5" /></button>
              <span className="font-bold text-lg w-8 text-center tabular-nums">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-[#8D0B41] active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!isValid}
              className={`flex-1 flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-[0.98] ${isValid
                ? 'bg-[#8D0B41] text-white shadow-xl shadow-[#8D0B41]/20 hover:bg-[#B01E58] hover:shadow-2xl hover:shadow-[#8D0B41]/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              <span>Add to Order</span>
              <span>${calculateTotal}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartView = ({
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: {
  cartItems: CartItem[],
  onClose: () => void,
  onUpdateQuantity: (id: string, newQty: number) => void,
  onRemoveItem: (id: string) => void,
  onCheckout: () => void
}) => {
  const total = cartItems.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);
  const tax = total * 0.05;
  const grandTotal = total + tax;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative animate-fade-in font-sans">

      {/* Premium Header */}
      <div className="relative shrink-0 overflow-hidden h-32 rounded-b-[2.5rem] shadow-xl z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2E0219]"></div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase mb-0.5">Your Order</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif-custom font-bold text-white italic">Table 12</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 -mt-4 pt-8 space-y-5">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <h3 className="font-serif-custom text-2xl text-gray-800 font-bold mb-2">Your plate is empty</h3>
              <p className="text-gray-500 max-w-[200px] mx-auto text-sm">Explore our menu and add some delicious culinary delights.</p>
            </div>
            <button onClick={onClose} className="text-[#8D0B41] font-bold text-sm tracking-wide uppercase border-b-2 border-[#8D0B41]/20 hover:border-[#8D0B41] transition-all">Browse Menu</button>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/60 relative overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-serif-custom text-xl font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                  {Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-xs text-gray-500 font-medium leading-relaxed bg-gray-50 inline-block px-2 py-1 rounded-lg mt-1 border border-gray-100">
                      {formatOptions(item.selectedOptions)}
                    </p>
                  )}
                  {item.instructions && <p className="text-xs text-orange-600/80 mt-2 flex items-center gap-1"><span className="w-1 h-1 bg-orange-400 rounded-full"></span> "{item.instructions}"</p>}
                </div>
                <p className="font-serif-custom font-bold text-lg text-[#8D0B41] shrink-0">${(item.finalPrice * item.quantity).toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-1 border border-gray-200/50">
                  <button
                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 text-sm hover:text-[#8D0B41] active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800 tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 text-sm hover:text-[#8D0B41] active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 rounded-t-[2.5rem] border-t border-white/50 p-6 space-y-5 animate-slide-up">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Subtotal</span>
              <span className="font-medium font-serif-custom text-gray-800">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Taxes & Fees (5%)</span>
              <span className="font-medium font-serif-custom text-gray-800">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-gray-100">
              <span className="text-gray-900 font-bold text-base">Grand Total</span>
              <span className="text-3xl font-serif-custom font-bold text-[#8D0B41]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-[#8D0B41] to-[#B01E58] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#8D0B41]/25 hover:shadow-2xl hover:shadow-[#8D0B41]/40 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group"
          >
            <span>Proceed to Checkout</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

const CheckoutView = ({ cartItems, onPlaceOrder, onBack }: { cartItems: CartItem[], onPlaceOrder: () => Promise<void>, onBack: () => void }) => {
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cartItems.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);
  const tax = total * 0.05;
  const grandTotal = total + tax;

  const handleConfirm = async () => {
    // Validation check (Mock)
    const unavailableItem = cartItems.find(item => {
      const menuItem = MENU_DATA.find(m => m.id === item.menuItemId);
      return !menuItem?.isAvailable;
    });

    if (unavailableItem) {
      setError(`Sorry, "${unavailableItem.name}" is no longer available.`);
      return;
    }

    setIsPlacing(true);
    setError(null);

    try {
      await onPlaceOrder();
    } catch (err) {
      setError("Connection failed. Please give it another try.");
      setIsPlacing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative animate-fade-in font-sans">

      {/* Premium Header */}
      <div className="relative shrink-0 overflow-hidden h-32 rounded-b-[2.5rem] shadow-xl z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2E0219]"></div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onBack}
              disabled={isPlacing}
              className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase mb-0.5">Final Step</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif-custom font-bold text-white italic">Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 -mt-4 pt-8 space-y-6">
        {/* Table Info Card */}
        <div className="bg-white p-5 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-[#8D0B41]"></div>
          <div>
            <span className="text-gray-500 font-medium text-xs tracking-widest uppercase">Delivering to</span>
            <h3 className="text-[#8D0B41] font-serif-custom font-bold text-2xl">Table 12</h3>
          </div>
          <div className="w-12 h-12 bg-[#FDF2F6] rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-[#8D0B41] rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-lg px-2">Order Summary</h3>
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex gap-4">
                  <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">{item.quantity}x</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatOptions(item.selectedOptions)}</p>
                  </div>
                </div>
                <div className="font-bold text-gray-900 text-sm">${(item.finalPrice * item.quantity).toFixed(2)}</div>
              </div>
            ))}

            {/* Totals Section inside card */}
            <div className="p-4 bg-gray-50/30 space-y-2">
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Taxes (5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold text-sm pt-2 border-t border-gray-200/50">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-3 border border-red-100 animate-slide-up shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 rounded-t-[2.5rem] border-t border-white/50 p-6 space-y-5 animate-slide-up">
        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
          <span className="text-gray-500 font-medium">Total to Pay</span>
          <span className="text-3xl font-serif-custom font-bold text-[#8D0B41]">${grandTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={isPlacing}
          className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center space-x-2 transition-all ${isPlacing ? 'bg-[#5A0528] cursor-wait' : 'bg-[#8D0B41] hover:bg-[#B01E58] shadow-[#8D0B41]/20 hover:shadow-[#8D0B41]/40 active:scale-[0.98]'}`}
        >
          {isPlacing ? (
            <><span>Placing Order</span><Loader2 className="w-5 h-5 animate-spin" /></>
          ) : (
            error ? <><span>Retry</span><RefreshCw className="w-5 h-5" /></> : <><span>Confirm Order</span><Check className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};

const SuccessView = ({ activeOrder, onNewOrder, onSubmitFeedback }: { activeOrder: ActiveOrder | null, onNewOrder: () => void, onSubmitFeedback: (rating: number, comment: string) => void }) => {
  // Only show happy success animation if status is 'received' (just placed)
  // Otherwise show Tracking UI
  if (!activeOrder) return null;

  if (activeOrder.status === 'received' || activeOrder.status === 'preparing' || activeOrder.status === 'ready') {
    return (
      <TrackingView activeOrder={activeOrder} />
    );
  }

  // Served State with Feedback
  return (
    <FeedbackView activeOrder={activeOrder} onNewOrder={onNewOrder} onSubmitFeedback={onSubmitFeedback} />
  );
};

const FeedbackView = ({ activeOrder, onNewOrder, onSubmitFeedback }: { activeOrder: ActiveOrder, onNewOrder: () => void, onSubmitFeedback: (r: number, c: string) => void }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(activeOrder.feedbackSubmitted || false);

  const handleSubmit = () => {
    onSubmitFeedback(rating, comment);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col w-full max-w-md mx-auto h-full bg-[#f8f9fa] animate-fade-in relative z-0">
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-8 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#8D0B41] rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="absolute top-1/3 right-12 w-3 h-3 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.5s]"></div>
            <div className="absolute bottom-1/3 left-20 w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
          </div>

          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(141,11,65,0.15)] animate-[scale-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)] relative">
            <div className="absolute inset-0 bg-[#8D0B41]/5 rounded-full animate-ping"></div>
            <Check className="w-12 h-12 text-[#8D0B41]" />
          </div>

          <div className="space-y-4 max-w-xs mx-auto">
            <h2 className="text-4xl font-serif-custom font-bold text-[#5A0528] mb-2 leading-tight">Thank You!</h2>
            <p className="text-gray-500 text-lg">We're glad you dined with us. Your feedback helps us serve you better.</p>
          </div>
        </div>

        <div className="p-6 pb-8 bg-white/50 backdrop-blur-sm rounded-t-[2.5rem]">
          <button onClick={onNewOrder} className="w-full bg-[#5A0528] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#5A0528]/20 hover:bg-[#2E0219] hover:shadow-[#5A0528]/40 transition-all active:scale-[0.98]">Return to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto h-full bg-[#f8f9fa] animate-fade-in relative">

      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-b-[3rem] shadow-xl shadow-[#8D0B41]/10 z-10 bg-[#5A0528] shrink-0 h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2E0219]"></div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative px-6 flex flex-col justify-center h-full text-center space-y-2">
          <span className="inline-block mx-auto p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg mb-2">
            <Utensils className="w-8 h-8 text-white" />
          </span>
          <h2 className="text-3xl font-serif-custom font-bold text-white leading-tight">Bon Appétit!</h2>
          <p className="text-white/70 text-sm font-medium">We hope you enjoyed your meal.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 -mt-6">
        {/* Rating Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 text-center space-y-4 relative z-20">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rate your experience</span>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="group relative focus:outline-none transition-transform hover:scale-110 active:scale-90"
              >
                <Star
                  className={`w-10 h-10 transition-all duration-300 ${rating >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' : 'text-gray-200 group-hover:text-yellow-200'}`}
                />
                {rating >= star && <div className="absolute inset-0 bg-yellow-400/20 blur-lg rounded-full animate-pulse -z-10"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Area */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 ml-2">Any comments for the chef?</label>
          <textarea
            className="w-full p-5 bg-white border-0 ring-1 ring-gray-100 rounded-3xl text-base focus:outline-none focus:ring-2 focus:ring-[#8D0B41]/20 resize-none h-40 shadow-inner placeholder:text-gray-300 transition-all font-sans"
            placeholder="Tell us what you loved..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] border-t border-white/50 space-y-3 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#8D0B41]/20 transition-all flex items-center justify-center space-x-2 ${rating > 0 ? 'bg-[#8D0B41] hover:bg-[#B01E58] hover:shadow-[#8D0B41]/40 active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed opacity-70'}`}
        >
          <span>Submit Feedback</span>
          <Send className="w-5 h-5 ml-1" />
        </button>
        <button onClick={onNewOrder} className="w-full bg-transparent text-gray-400 py-3 text-sm font-bold hover:text-gray-600 transition-colors uppercase tracking-wider">Skip Feedback</button>
      </div>
    </div>
  );
};

const TrackingView = ({ activeOrder }: { activeOrder: ActiveOrder }) => {
  const steps = [
    { id: 'received', label: 'Received', icon: CheckCircle2 },
    { id: 'preparing', label: 'Preparing', icon: ChefHat },
    { id: 'ready', label: 'Ready', icon: Bell },
    { id: 'served', label: 'Served', icon: Utensils },
  ];

  const currentIndex = getStatusIndex(activeOrder.status);

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto h-full bg-[#f8f9fa] animate-fade-in relative z-0">

      {/* Premium Gradient Header Status */}
      <div className="relative overflow-hidden rounded-b-[3rem] shadow-xl shadow-[#8D0B41]/10 z-10 bg-[#5A0528]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2E0219]"></div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative px-6 py-8 pb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1 block">Live Status</span>
              <h2 className="text-3xl font-serif-custom font-bold text-white leading-tight">Order #{activeOrder.orderId}</h2>
              <div className="inline-flex items-center gap-2 mt-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-white/80" />
                <span className="text-white/90 text-sm font-medium">Est. 15-20 mins</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg animate-pulse">
              {activeOrder.status === 'preparing' ? <ChefHat className="w-6 h-6 text-white" /> : <Bell className="w-6 h-6 text-white" />}
            </div>
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-center px-2 z-10">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 w-full h-1 bg-white/10 -z-10 transform -translate-y-1/2 rounded-full"></div>
            <div className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-white/80 to-white -z-10 transform -translate-y-1/2 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}></div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;

              // Dynamic text positioning
              let textClasses = "absolute -bottom-9 left-1/2 -translate-x-1/2 text-center";
              if (index === 0) textClasses = "absolute -bottom-9 left-0 text-left";
              if (index === steps.length - 1) textClasses = "absolute -bottom-9 right-0 text-right";

              return (
                <div key={step.id} className={`flex flex-col items-center relative group`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 border-2 ${isActive ? 'bg-white border-white text-[#8D0B41] shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110' : 'bg-[#5A0528] border-white/20 text-white/40'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`${textClasses} text-[10px] font-bold uppercase tracking-wider w-20 leading-tight transition-all duration-300 ${isActive ? 'text-white opacity-100 translate-y-0' : 'text-white/40 opacity-60 translate-y-1'}`}>{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pt-8">
        <div className="flex items-center space-x-3 text-[#8D0B41] text-sm bg-white p-4 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#8D0B41]/10">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8D0B41] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8D0B41]"></span>
          </div>
          <span className="font-medium">Real-time kitchen updates enabled</span>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-gray-800 px-2 text-lg">Order Summary</h3>
          <div className="bg-white rounded-3xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 space-y-5">
            {activeOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex space-x-4">
                  <div className="bg-gray-50 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-gray-600 border border-gray-100 shadow-sm">{item.quantity}x</div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{formatOptions(item.selectedOptions)}</p>
                  </div>
                </div>
                <div className="font-bold text-gray-900">${(item.finalPrice * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-end">
              <span className="text-gray-500 font-medium pb-1">Total Amount</span>
              <span className="text-3xl font-serif-custom font-bold text-[#8D0B41]">${activeOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MenuContent = ({ cartCount, onOpenCart, cartTotal, addToCart }: any) => {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    return MENU_DATA.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVeg = vegOnly ? item.isVeg : true;
      return matchesCategory && matchesSearch && matchesVeg;
    });
  }, [activeCategory, searchQuery, vegOnly]);

  const groupedItems = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filteredItems };
    const groups: Partial<Record<Category, MenuItem[]>> = {};
    CATEGORIES.forEach(cat => {
      const items = filteredItems.filter(item => item.category === cat);
      if (items.length > 0) groups[cat] = items;
    });
    return groups;
  }, [activeCategory, filteredItems]);

  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    if (!item.customizationGroups || item.customizationGroups.length === 0) {
      addToCart({
        id: Date.now().toString() + Math.random(),
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        finalPrice: item.price,
        quantity: 1,
        selectedOptions: {},
        instructions: ''
      });
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative animate-fade-in font-sans">
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Hero Header */}
      <div className="relative h-48 shrink-0 bg-[#5A0528] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5A0528] to-[#2E0219]"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute bottom-0 right-0 p-8 transform translate-y-4 translate-x-4 opacity-10">
          <ChefHat className="w-64 h-64 text-white" />
        </div>

        <div className="relative h-full flex flex-col justify-center px-6 pt-2">
          <span className="text-[#E8A0BF] text-xs font-bold tracking-[0.2em] uppercase mb-2">Welcome to</span>
          <h1 className="text-4xl font-serif-custom text-white font-bold tracking-tight drop-shadow-md">Lumière <span className="text-[#ffccd5] italic font-light">Bistro</span></h1>
          <div className="flex items-center space-x-2 mt-4 text-white/80">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide">Table 12 • Open Now</span>
          </div>
        </div>
      </div>

      {/* Sticky Navigation & Search */}
      <div className="sticky top-0 z-30 bg-[#f8f9fa]/80 backdrop-blur-lg shadow-sm">

        {/* Search & Filter Bar */}
        <div className="px-4 py-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search for dishes..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300/80 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8D0B41]/20 focus:border-[#8D0B41]/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3.5 rounded-xl border flex items-center justify-center transition-all ${vegOnly
              ? 'bg-green-50 border-green-300 text-green-700 shadow-inner'
              : 'bg-white border-gray-300/80 text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
          >
            <Leaf className={`w-5 h-5 ${vegOnly ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto px-4 pb-3 pt-2 hide-scrollbar gap-3 snap-x">
          <button
            onClick={() => setActiveCategory('All')}
            className={`snap-start shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center min-w-[80px] ${activeCategory === 'All'
              ? 'bg-[#8D0B41] text-white shadow-lg shadow-[#8D0B41]/25 scale-105'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-start shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center min-w-[80px] ${activeCategory === cat
                ? 'bg-[#8D0B41] text-white shadow-lg shadow-[#8D0B41]/25 scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-8" ref={scrollContainerRef}>
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-4 animate-slide-up">
            <h3 className="font-serif-custom text-2xl text-gray-800 font-bold pl-1 border-l-4 border-[#8D0B41] leading-none py-1">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items?.map(item => (
                <MenuItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedItems).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-medium">No dishes found matching your criteria</p>
            <button onClick={() => { setSearchQuery(''); setVegOnly(false); }} className="text-[#8D0B41] font-semibold text-sm hover:underline">Clear filters</button>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-40 animate-bounce-in">
          <button
            onClick={onOpenCart}
            className="w-full bg-[#1a1a1a] text-white p-4 rounded-2xl shadow-2xl shadow-[#8D0B41]/20 flex items-center justify-between group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#8D0B41] to-[#5A0528] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white border border-white/10 group-hover:scale-110 transition-transform">
                {cartCount}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-base tracking-wide">View Order</span>
                <span className="text-xs text-white/60 font-medium">Items in cart</span>
              </div>
            </div>

            <div className="relative flex items-center gap-2 pr-2">
              <span className="font-bold text-xl tracking-tight">${cartTotal.toFixed(2)}</span>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}


function AppContent() {
  const [view, setView] = useState<'scan' | 'landing' | 'confirmation' | 'menu' | 'cart' | 'checkout' | 'success'>('scan');
  const [session, setSession] = useState<Session | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [restored, setRestored] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Initial Session Handling & URL Parsing
  useEffect(() => {
    // Check for session initialization via URL
    const rId = searchParams.get('restaurantId');
    const tId = searchParams.get('tableId');

    if (rId && tId) {
      validateSession(rId, tId).then(valid => {
        if (valid) {
          setSession({ restaurantId: rId, tableId: tId });
          setView('confirmation');
          // Clear URL to prevent persistence on refresh (As requested)
          router.replace('/');
        } else {
          // Handle invalid logic (e.g. show error screen)
          console.error("Invalid session params");
        }
      });
    } else {
      // No params, stay on 'scan' unless state is already set (which it isn't on first load)
      // If we want to restore previous session from localStorage, we could do it here.
      // BUT REQUIREMENT SAYS: "If user refreshes... session must not persist."
      // So we do NOT restore session from localStorage.
      setView('scan');
    }
  }, [searchParams, router]);

  // Cart Persistence (Only persists if session is active - actually we should maybe clear this if no session?)
  // For now keeping cart persistence logic but it might be orphaned if session is lost.
  // We'll scope it to tableId if session exists.
  useEffect(() => {
    if (!session) return;

    const savedCart = localStorage.getItem(`dinestack_cart_${session.tableId}`);
    const savedOrder = localStorage.getItem(`dinestack_order_${session.tableId}`);

    if (savedCart) {
      try { setCartItems(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        setActiveOrder(parsedOrder);
        if (parsedOrder.status !== 'served' || !parsedOrder.feedbackSubmitted) {
          setView('success');
        } else {
          // If order is done, go to menu? Or stay success?
        }
      } catch (e) { console.error(e); }
    }
    setRestored(true);
  }, [session]);

  useEffect(() => {
    if (restored && session) {
      localStorage.setItem(`dinestack_cart_${session.tableId}`, JSON.stringify(cartItems));
    }
  }, [cartItems, restored, session]);

  useEffect(() => {
    if (restored && session) {
      if (activeOrder) {
        localStorage.setItem(`dinestack_order_${session.tableId}`, JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(`dinestack_order_${session.tableId}`);
      }
    }
  }, [activeOrder, restored, session]);

  // Order Status Simulation
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'served') return;

    const interval = setInterval(() => {
      setActiveOrder(current => {
        if (!current || current.status === 'served') return current;

        let nextStatus: OrderStatus = current.status;
        if (current.status === 'received') nextStatus = 'preparing';
        else if (current.status === 'preparing') nextStatus = 'ready';
        else if (current.status === 'ready') nextStatus = 'served';

        if (nextStatus !== current.status) {
          return { ...current, status: nextStatus };
        }
        return current;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => [...prev, newItem]);
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty === 0) setCartItems(prev => prev.filter(item => item.id !== id));
    else setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const placeOrder = async () => {
    const shouldFail = SIMULATE_NETWORK_ERROR || Math.random() < 0.1;

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error("Network Error"));
        } else {
          const newOrder: ActiveOrder = {
            orderId: Math.floor(1000 + Math.random() * 9000).toString(),
            items: [...cartItems],
            status: 'received',
            timestamp: Date.now(),
            totalAmount: cartItems.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0) * 1.05
          };

          setActiveOrder(newOrder);
          setCartItems([]);
          setView('success');
          resolve();
        }
      }, 1500);
    });
  };

  const submitFeedback = (rating: number, comment: string) => {
    if (activeOrder) {
      setActiveOrder({ ...activeOrder, feedbackSubmitted: true });
    }
  };

  const startNewOrder = () => {
    setActiveOrder(null);
    setView('menu');
  };

  // Handle successful scan from internal scanner
  const handleScanSuccess = (rId: string, tId: string) => {
    validateSession(rId, tId).then(valid => {
      if (valid) {
        setSession({ restaurantId: rId, tableId: tId });
        setView('confirmation');
      }
    });
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (!IS_RESTAURANT_OPEN) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden font-sans selection:bg-[#8D0B41] selection:text-white bg-slate-50">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,600&display=swap'); body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; } .font-serif-custom { font-family: 'Cormorant Garamond', serif; }`}</style>
        <div className="absolute inset-0 bg-premium-gradient z-0"></div>
        <main className="relative z-10 w-full max-w-md mx-auto h-[100dvh] flex flex-col justify-between">
          <ClosedView />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans selection:bg-[#8D0B41] selection:text-white bg-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,600&display=swap');
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-serif-custom { font-family: 'Cormorant Garamond', serif; }
        .bg-premium-gradient { background: radial-gradient(circle at 50% 0%, #750a36 0%, #8D0B41 35%, #ffffff 75%); background-attachment: fixed; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 8px 32px 0 rgba(141, 11, 65, 0.15); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up-fade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-fade-in { animation: fade-in-down 1.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.2s; }
    .animate-laser { animation: scan-laser 2s linear infinite; }
        @keyframes scan-laser { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>

      {view !== 'menu' && view !== 'cart' && view !== 'checkout' && view !== 'success' && <div className="absolute inset-0 bg-premium-gradient z-0 transition-opacity duration-1000"></div>}

      <main className="relative z-10 w-full max-w-md mx-auto h-[100dvh] flex flex-col justify-between">
        {view === 'scan' && <ScanQRView onScanSuccess={handleScanSuccess} />}
        {view === 'landing' && <LandingView onComplete={() => setView('confirmation')} />}
        {view === 'confirmation' && <ConfirmationView session={session} onConfirm={() => setView('menu')} onCancel={() => setView('scan')} />}
        {view === 'menu' && <MenuContent cartCount={cartCount} cartTotal={cartTotal} onOpenCart={() => setView('cart')} addToCart={addToCart} />}
        {view === 'cart' && (
          <CartView cartItems={cartItems} onClose={() => setView('menu')} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} onCheckout={() => setView('checkout')} />
        )}
        {view === 'checkout' && (
          <CheckoutView cartItems={cartItems} onBack={() => setView('cart')} onPlaceOrder={placeOrder} />
        )}
        {view === 'success' && <SuccessView activeOrder={activeOrder} onNewOrder={startNewOrder} onSubmitFeedback={submitFeedback} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-[#8D0B41]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
