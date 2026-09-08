import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, OrderRecord, OrderPipelineStep } from '../types';

interface CartContextType {
  cart: CartItem[];
  orders: OrderRecord[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  discountCode: string;
  applyDiscountCode: (code: string) => boolean;
  removeDiscount: () => void;
  discountError: string | null;
  shipping: number;
  finalTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isOrderHistoryOpen: boolean;
  setIsOrderHistoryOpen: (open: boolean) => void;
  isCheckingOut: boolean;
  checkoutSuccess: boolean;
  lastOrderId: string | null;
  performCheckout: (customerInfo?: { name: string; email: string }) => Promise<void>;
  resetCheckout: () => void;
  addOrder: (order: OrderRecord) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderRecord['orderStatus'], trackingNumber?: string) => void;
  updatePaymentStatus: (orderId: string, status: OrderRecord['paymentStatus']) => void;
  advanceOrderStep: (orderId: string) => void;
  setOrderStep: (orderId: string, step: OrderPipelineStep) => void;
  deleteOrder: (orderId: string) => void;
  updateOrder: (orderId: string, updatedFields: Partial<OrderRecord>) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const SAMPLE_INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ORD_00941',
    customerName: 'Aarav Singhania',
    customerEmail: 'aarav.singhania@heritageart.in',
    customerPhone: '+91 98210 44521',
    customerCity: 'Juhu, Mumbai',
    customerState: 'Maharashtra',
    date: '08 Sep, 2026',
    orderTime: '07:45 PM',
    orderMonth: '2026-09',
    items: [
      {
        id: 'art-01',
        type: 'artwork',
        title: 'Symphony of the Solitary Tide',
        subtitle: 'Original Oil on Belgian Linen (40 x 54 in)',
        price: 320000,
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Oil on Canvas',
      }
    ],
    subtotal: 320000,
    discount: 15000,
    shipping: 0,
    totalAmount: 305000,
    paymentMethod: 'HDFC NetBanking / RTGS',
    paymentStatus: 'Paid',
    orderStatus: 'Order Placed',
    currentStep: 1,
    stepStatus: 'placed',
    deliveryAddress: 'Villa 14, Palm Avenue, Juhu, Mumbai 400049',
    stepTimestamps: {
      placed: '07:45 PM, 08 Sep'
    }
  },
  {
    id: 'ORD_00940',
    customerName: 'Meera Kapoor',
    customerEmail: 'meera.k@kapoordesigns.com',
    customerPhone: '+91 99100 88234',
    customerCity: 'Amrita Shergill Marg',
    customerState: 'New Delhi',
    date: '07 Sep, 2026',
    orderTime: '02:15 PM',
    orderMonth: '2026-09',
    items: [
      {
        id: 'art-02',
        type: 'artwork',
        title: 'Whispers of the Eternal Forest',
        subtitle: 'Handmade Pigment & 24K Gold Leaf on Canvas (36 x 48 in)',
        price: 245000,
        image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Oil & Gold Leaf',
      }
    ],
    subtotal: 245000,
    discount: 0,
    shipping: 0,
    totalAmount: 245000,
    paymentMethod: 'Instant UPI / Razorpay',
    paymentStatus: 'Paid',
    orderStatus: 'Fine Art Packing',
    currentStep: 2,
    stepStatus: 'accepted',
    deliveryAddress: 'B-42, Amrita Shergill Marg, New Delhi 110003',
    stepTimestamps: {
      placed: '02:15 PM, 07 Sep',
      accepted: '03:00 PM, 07 Sep (Proceeded to Studio Packing)'
    }
  },
  {
    id: 'ORD_00938',
    customerName: 'Devansh Malhotra',
    customerEmail: 'devansh@malhotragroup.co',
    customerPhone: '+91 98450 12903',
    customerCity: 'Koramangala',
    customerState: 'Bengaluru',
    date: '06 Sep, 2026',
    orderTime: '11:20 AM',
    orderMonth: '2026-09',
    items: [
      {
        id: 'art-03',
        type: 'artwork',
        title: 'Nocturne in Venetian Crimson',
        subtitle: 'Impasto Oil Painting with Custom Italian Oak Frame',
        price: 185000,
        image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Oil on Canvas',
      }
    ],
    subtotal: 185000,
    discount: 5000,
    shipping: 0,
    totalAmount: 180000,
    paymentMethod: 'Instant UPI Transfer',
    paymentStatus: 'Paid',
    orderStatus: 'In Transit',
    currentStep: 3,
    stepStatus: 'dispatched',
    deliveryAddress: 'Penthouse 7B, Sky Tower, Koramangala, Bengaluru 560034',
    trackingNumber: 'BLUEDART-EXP-90812',
    stepTimestamps: {
      placed: '11:20 AM, 06 Sep',
      accepted: '01:00 PM, 06 Sep',
      dispatched: '09:30 AM, 07 Sep (Courier Out for Delivery)'
    }
  },
  {
    id: 'ORD_00935',
    customerName: 'Countess Vivienne St. Claire',
    customerEmail: 'vivienne@stclairecollections.ch',
    customerPhone: '+41 79 412 8890',
    customerCity: 'Zurich',
    customerState: 'Switzerland',
    date: '26 Aug, 2026',
    orderTime: '04:10 PM',
    orderMonth: '2026-08',
    items: [
      {
        id: 'art-04',
        type: 'artwork',
        title: 'Echoes of the Florentine Atelier',
        subtitle: 'Classical Realism Oil on Linen (48 x 60 in)',
        price: 450000,
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Oil on Linen',
      }
    ],
    subtotal: 450000,
    discount: 25000,
    shipping: 0,
    totalAmount: 425000,
    paymentMethod: 'International Wire / SWIFT',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    currentStep: 4,
    stepStatus: 'delivered',
    deliveryAddress: 'Bahnhofstrasse 45, 8001 Zurich, Switzerland',
    trackingNumber: 'DHL-EXPRESS-992301',
    stepTimestamps: {
      placed: '04:10 PM, 26 Aug',
      accepted: '06:00 PM, 26 Aug',
      dispatched: '10:00 AM, 27 Aug',
      delivered: '02:30 PM, 30 Aug (Delivered & Verified)'
    }
  },
  {
    id: 'ORD_00932',
    customerName: 'Rajesh & Sunita Oberoi',
    customerEmail: 'oberoi.art@gmail.com',
    customerPhone: '+91 98110 55102',
    customerCity: 'Golf Links',
    customerState: 'New Delhi',
    date: '18 Aug, 2026',
    orderTime: '01:05 PM',
    orderMonth: '2026-08',
    items: [
      {
        id: 'art-05',
        type: 'artwork',
        title: 'Serenade at Dawn',
        subtitle: 'Fine Charcoal & Pastel on Archival Cotton Paper',
        price: 95000,
        image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Charcoal & Graphite',
      }
    ],
    subtotal: 95000,
    discount: 0,
    shipping: 0,
    totalAmount: 95000,
    paymentMethod: 'UPI / Google Pay',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    currentStep: 4,
    stepStatus: 'delivered',
    deliveryAddress: 'House 12, Golf Links, New Delhi 110003',
    trackingNumber: 'BLUEDART-EXP-77192',
    stepTimestamps: {
      placed: '01:05 PM, 18 Aug',
      accepted: '02:30 PM, 18 Aug',
      dispatched: '11:00 AM, 19 Aug',
      delivered: '04:15 PM, 21 Aug (Delivered)'
    }
  }
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_art_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_art_orders_v3');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return SAMPLE_INITIAL_ORDERS;
    } catch {
      return SAMPLE_INITIAL_ORDERS;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_art_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_art_orders_v3', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const applyDiscountCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'MASTER2026' || clean === 'KULDEEP15') {
      setDiscountCode(clean);
      setDiscountPercent(0.15);
      setDiscountError(null);
      return true;
    } else if (clean === 'VIPCOLLECTOR') {
      setDiscountCode(clean);
      setDiscountPercent(0.2);
      setDiscountError(null);
      return true;
    } else {
      setDiscountError('Invalid invitation code');
      return false;
    }
  };

  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountPercent(0);
    setDiscountError(null);
  };

  const discount = Math.round(subtotal * discountPercent);
  const shipping = 0;
  const finalTotal = Math.max(0, subtotal - discount + shipping);

  const addOrder = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
  };

  // 4-Step Pipeline Progression Engine
  const advanceOrderStep = (orderId: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    const stamp = `${timeStr}, ${dateStr}`;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        if (o.currentStep === 1) {
          // Advance to Step 2: Order Accepted & Proceeded
          return {
            ...o,
            currentStep: 2 as const,
            stepStatus: 'accepted' as const,
            orderStatus: 'Fine Art Packing',
            stepTimestamps: {
              ...o.stepTimestamps,
              accepted: `${stamp} (Proceeded to Packing)`
            }
          };
        } else if (o.currentStep === 2) {
          // Advance to Step 3: Out for Delivery
          const autoTracking = o.trackingNumber || `BLUEDART-EXP-${Math.floor(10000 + Math.random() * 90000)}`;
          return {
            ...o,
            currentStep: 3 as const,
            stepStatus: 'dispatched' as const,
            orderStatus: 'In Transit',
            trackingNumber: autoTracking,
            stepTimestamps: {
              ...o.stepTimestamps,
              dispatched: `${stamp} (Dispatched with ${autoTracking.split('-')[0]})`
            }
          };
        } else if (o.currentStep === 3) {
          // Advance to Step 4: Delivered
          return {
            ...o,
            currentStep: 4 as const,
            stepStatus: 'delivered' as const,
            orderStatus: 'Delivered',
            stepTimestamps: {
              ...o.stepTimestamps,
              delivered: `${stamp} (Delivered & Verified)`
            }
          };
        }
        return o;
      })
    );
  };

  const setOrderStep = (orderId: string, step: OrderPipelineStep) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    const stamp = `${timeStr}, ${dateStr}`;

    const stepStatusMap: Record<OrderPipelineStep, OrderRecord['stepStatus']> = {
      1: 'placed',
      2: 'accepted',
      3: 'dispatched',
      4: 'delivered'
    };

    const orderStatusMap: Record<OrderPipelineStep, OrderRecord['orderStatus']> = {
      1: 'Order Placed',
      2: 'Fine Art Packing',
      3: 'In Transit',
      4: 'Delivered'
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          currentStep: step,
          stepStatus: stepStatusMap[step],
          orderStatus: orderStatusMap[step],
          stepTimestamps: {
            ...o.stepTimestamps,
            ...(step === 2 ? { accepted: stamp } : {}),
            ...(step === 3 ? { dispatched: stamp } : {}),
            ...(step === 4 ? { delivered: stamp } : {})
          }
        };
      })
    );
  };

  const cancelOrder = (orderId: string, reason = 'Cancelled by Studio Owner') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'Cancelled',
              paymentStatus: o.paymentStatus === 'Paid' ? 'Refunded' : 'Failed',
              cancellationReason: reason,
              cancelledAt: `${timeStr}, ${dateStr}`
            }
          : o
      )
    );
  };

  const updateOrderStatus = (orderId: string, status: OrderRecord['orderStatus'], trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: status,
              ...(trackingNumber !== undefined ? { trackingNumber } : {})
            }
          : o
      )
    );
  };

  const updatePaymentStatus = (orderId: string, status: OrderRecord['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, paymentStatus: status } : o
      )
    );
  };

  const performCheckout = async (customerInfo?: { name: string; email: string }) => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const generatedId = 'ORD_' + Math.floor(10000 + Math.random() * 90000);
    setLastOrderId(generatedId);
    setIsCheckingOut(false);
    setCheckoutSuccess(true);

    const now = new Date();
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: OrderRecord = {
      id: generatedId,
      customerName: customerInfo?.name || 'Collector Guest',
      customerEmail: customerInfo?.email || 'collector@kuldeepsingh.art',
      customerCity: 'New Delhi',
      date: dateStr,
      orderTime: timeStr,
      orderMonth: nowMonth,
      items: [...cart],
      subtotal,
      discount,
      shipping,
      totalAmount: finalTotal,
      paymentMethod: 'Instant Razorpay / Wire',
      paymentStatus: 'Paid',
      orderStatus: 'Order Placed',
      currentStep: 1,
      stepStatus: 'placed',
      deliveryAddress: 'Standard Fine Art Insured Crating',
      stepTimestamps: {
        placed: `${timeStr}, ${dateStr}`
      }
    };

    addOrder(newOrder);
    clearCart();
  };

  const resetCheckout = () => {
    setCheckoutSuccess(false);
    setLastOrderId(null);
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const updateOrder = (orderId: string, updatedFields: Partial<OrderRecord>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o))
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discount,
        discountCode,
        applyDiscountCode,
        removeDiscount,
        discountError,
        shipping,
        finalTotal,
        isCartOpen,
        setIsCartOpen,
        isOrderHistoryOpen,
        setIsOrderHistoryOpen,
        isCheckingOut,
        checkoutSuccess,
        lastOrderId,
        performCheckout,
        resetCheckout,
        addOrder,
        cancelOrder,
        updateOrderStatus,
        updatePaymentStatus,
        advanceOrderStep,
        setOrderStep,
        deleteOrder,
        updateOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
