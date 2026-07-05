"use client";

import React, { useState } from 'react';
import { User, Phone, CheckCircle2, ChevronRight, Loader2, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { placeOrder, validateCoupon, getAvailableCoupons } from '@/lib/api';

interface CheckoutViewProps {
    onBack: () => void;
    onSuccess: (orderId: string) => void;
}

export default function CheckoutView({ onBack, onSuccess }: CheckoutViewProps) {
    const { cartItems, cartTotal, clearCart } = useCart();
    const [name, setName] = useState(sessionStorage.getItem('dinestack_customer_name') || '');
    const [phone, setPhone] = useState(sessionStorage.getItem('dinestack_customer_phone') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const [taxConfig, setTaxConfig] = useState({ enabled: true, rate: 5, mode: 'EXCLUSIVE', restaurantId: '' });

    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    React.useEffect(() => {
        const rawSession = sessionStorage.getItem('sessionData');
        if (rawSession) {
            try {
                const sessionData = JSON.parse(rawSession);
                if (sessionData && sessionData.restaurant) {
                    const rId = sessionData.restaurant.id || '';
                    setTaxConfig({
                        enabled: sessionData.restaurant.gstEnabled !== false,
                        rate: sessionData.restaurant.defaultGstRate || 5,
                        mode: sessionData.restaurant.gstMode || 'EXCLUSIVE',
                        restaurantId: rId
                    });

                    if (rId) {
                        setIsLoadingCoupons(true);
                        getAvailableCoupons(rId).then(coupons => {
                            setAvailableCoupons(coupons);
                            setIsLoadingCoupons(false);
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to parse session data', e);
            }
        }
    }, []);

    const platformFee = 10;
    const subtotal = cartTotal;
    let discount = appliedCouponCode ? discountAmount : 0;
    let taxableAmount = Math.max(0, subtotal - discount);
    
    let gst = 0;
    let finalTotal = taxableAmount + platformFee;

    if (taxConfig.enabled) {
        if (taxConfig.mode === 'EXCLUSIVE') {
            gst = taxableAmount * (taxConfig.rate / 100);
            finalTotal = taxableAmount + gst + platformFee;
        } else {
            gst = taxableAmount - (taxableAmount / (1 + taxConfig.rate / 100));
            finalTotal = taxableAmount + platformFee;
        }
    }

    const handleApplyCoupon = async () => {
        if (!couponCodeInput.trim()) return;
        setIsApplyingCoupon(true);
        setCouponError(null);
        try {
            const result = await validateCoupon(couponCodeInput.trim(), subtotal, taxConfig.restaurantId);
            if (result.success) {
                setAppliedCouponCode(result.couponCode);
                setDiscountAmount(result.discountAmount);
                setCouponCodeInput(''); // clear input on success
            } else {
                setCouponError(result.error || 'Invalid coupon code');
                setAppliedCouponCode(null);
                setDiscountAmount(0);
            }
        } catch (err: any) {
            setCouponError(err.message || 'Failed to apply coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCouponCode(null);
        setDiscountAmount(0);
        setCouponError(null);
    };

    const applySelectedCoupon = async (code: string) => {
        setCouponCodeInput(code);
        setIsApplyingCoupon(true);
        setCouponError(null);
        try {
            const result = await validateCoupon(code, subtotal, taxConfig.restaurantId);
            if (result.success) {
                setAppliedCouponCode(result.couponCode);
                setDiscountAmount(result.discountAmount);
                setCouponCodeInput(''); 
            } else {
                setCouponError(result.error || 'Invalid coupon code');
                setAppliedCouponCode(null);
                setDiscountAmount(0);
            }
        } catch (err: any) {
            setCouponError(err.message || 'Failed to apply coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validate
            const nameRegex = /^[A-Za-z\s]{3,50}$/;
            if (!name.trim() || !nameRegex.test(name.trim())) {
                throw new Error("Please provide a valid name (letters only).");
            }
            
            const phoneRegex = /^\d{10}$/;
            if (!phone.trim() || !phoneRegex.test(phone.trim())) {
                throw new Error("Please provide a valid 10-digit phone number.");
            }

            // Prepare payload
            const items = cartItems.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.finalPrice,
            }));

            // Call API
            const deviceToken = localStorage.getItem('dinestack_device_token');
            const result = await placeOrder(items, finalTotal, undefined, deviceToken || undefined, appliedCouponCode || undefined, discountAmount > 0 ? discountAmount : undefined);

            if (result.success) {
                clearCart();
                onSuccess(result.orderNumber || 'ORDER-ID');
            } else {
                throw new Error("Failed to place order. Please try again.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="p-4 bg-white shadow-sm flex items-center gap-3">
                <button onClick={onBack} className="text-[#8D0B41] font-medium text-sm">Back</button>
                <h2 className="text-lg font-bold flex-1 text-center pr-8">Checkout</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Contact Info */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#8D0B41]" /> Contact Details
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#8D0B41] font-medium"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#8D0B41] font-medium"
                                placeholder="Phone Number"
                            />
                        </div>
                    </div>
                </div>

                {/* Apply Coupon */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#8D0B41]" /> Offers & Benefits
                    </h3>
                    {appliedCouponCode ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div>
                                <div className="text-sm font-bold text-green-700 uppercase tracking-wide">'{appliedCouponCode}' APPLIED</div>
                                <div className="text-xs text-green-600 font-medium mt-0.5">You saved ₹{discountAmount.toFixed(2)} on this order</div>
                            </div>
                            <button onClick={handleRemoveCoupon} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors uppercase">
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCodeInput}
                                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] uppercase placeholder-gray-400 font-medium"
                                        placeholder="ENTER COUPON CODE"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCodeInput.trim() || isApplyingCoupon}
                                        className="bg-gray-900 text-white px-4 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px]"
                                    >
                                        {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'APPLY'}
                                    </button>
                                </div>
                                {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                            </div>

                            {/* Available Coupons List */}
                            {isLoadingCoupons ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                            ) : availableCoupons.length > 0 ? (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Available Coupons</h4>
                                    <div className="grid gap-2">
                                        {availableCoupons.map(coupon => (
                                            <div 
                                                key={coupon.id} 
                                                onClick={() => applySelectedCoupon(coupon.code)}
                                                className="border border-dashed border-gray-300 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors group"
                                            >
                                                <div>
                                                    <div className="font-bold text-sm text-[#8D0B41] uppercase">{coupon.code}</div>
                                                    <div className="text-xs text-gray-600 font-medium mt-0.5">
                                                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                                        {coupon.maxDiscount ? ` up to ₹${coupon.maxDiscount}` : ''}
                                                    </div>
                                                    {coupon.minOrderValue > 0 && (
                                                        <div className="text-[10px] text-gray-400 mt-1">Valid on orders above ₹{coupon.minOrderValue}</div>
                                                    )}
                                                </div>
                                                <button className="text-xs font-bold text-[#8D0B41] bg-[#8D0B41]/10 px-3 py-1.5 rounded-md group-hover:bg-[#8D0B41] group-hover:text-white transition-colors">
                                                    Apply
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#8D0B41]" /> Order Summary
                    </h3>
                    <div className="space-y-2">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600"><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                                <span className="font-medium">₹{(item.finalPrice * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        
                        <div className="h-px bg-gray-100 my-2"></div>
                        
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Item Total</span>
                            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                        </div>
                        {appliedCouponCode && (
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Coupon Discount</span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Platform Fee</span>
                            <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                        </div>
                        {taxConfig.enabled && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{taxConfig.mode === 'INCLUSIVE' ? `GST (${taxConfig.rate}% Included)` : `GST (${taxConfig.rate}%)`}</span>
                                <span className="font-medium">₹{gst.toFixed(2)}</span>
                            </div>
                        )}
                        
                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-[#8D0B41]">₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t space-y-3">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#B01E58] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Pay ₹{finalTotal.toFixed(2)} & Confirm</span>}
                </button>
            </div>
        </div>
    );
}
