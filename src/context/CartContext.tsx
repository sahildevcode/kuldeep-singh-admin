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

  const BACKEND_API_BASE = 'https://kuldeep-singh-backend.onrender.com/api/orders';

  // Real-time bidirectional database sync with backend daemon
  useEffect(() => {
    let isMounted = true;

    const fetchLiveOrders = async () => {
      try {
        const res = await fetch(BACKEND_API_BASE);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            setOrders(data);
          }
        }
      } catch {
        // backend momentarily quiet
      }
    };

    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    fetch(BACKEND_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    }).catch((e) => console.warn('Backend sync failed:', e));
  };

  // 4-Step Pipeline Progression Engine
  const advanceOrderStep = (orderId: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    const stamp = `${timeStr}, ${dateStr}`;

    let patchFields: Partial<OrderRecord> | null = null;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        if (o.currentStep === 1) {
          // Advance to Step 2: Order Accepted & Proceeded
          patchFields = {
            currentStep: 2 as const,
            stepStatus: 'accepted' as const,
            orderStatus: 'Fine Art Packing',
            stepTimestamps: {
              ...o.stepTimestamps,
              accepted: `${stamp} (Proceeded to Packing)`
            }
          };
          return { ...o, ...patchFields };
        } else if (o.currentStep === 2) {
          // Advance to Step 3: Out for Delivery
          const autoTracking = o.trackingNumber || `BLUEDART-EXP-${Math.floor(10000 + Math.random() * 90000)}`;
          patchFields = {
            currentStep: 3 as const,
            stepStatus: 'dispatched' as const,
            orderStatus: 'In Transit',
            trackingNumber: autoTracking,
            stepTimestamps: {
              ...o.stepTimestamps,
              dispatched: `${stamp} (Dispatched with ${autoTracking.split('-')[0]})`
            }
          };
          return { ...o, ...patchFields };
        } else if (o.currentStep === 3) {
          // Advance to Step 4: Delivered
          patchFields = {
            currentStep: 4 as const,
            stepStatus: 'delivered' as const,
            orderStatus: 'Delivered',
            stepTimestamps: {
              ...o.stepTimestamps,
              delivered: `${stamp} (Delivered & Verified)`
            }
          };
          return { ...o, ...patchFields };
        }
        return o;
      })
    );

    if (patchFields) {
      fetch(`${BACKEND_API_BASE}/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchFields)
      }).catch((e) => console.warn('Backend sync failed:', e));
    }
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

    const targetOrder = orders.find((o) => o.id === orderId);
    const patchFields: Partial<OrderRecord> = {
      currentStep: step,
      stepStatus: stepStatusMap[step],
      orderStatus: orderStatusMap[step],
      stepTimestamps: {
        ...(targetOrder?.stepTimestamps || {}),
        ...(step === 2 ? { accepted: stamp } : {}),
        ...(step === 3 ? { dispatched: stamp } : {}),
        ...(step === 4 ? { delivered: stamp } : {})
      }
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patchFields } : o))
    );

    fetch(`${BACKEND_API_BASE}/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchFields)
    }).catch((e) => console.warn('Backend sync failed:', e));
  };

  const cancelOrder = (orderId: string, reason = 'Cancelled by Studio Owner') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const patchFields: Partial<OrderRecord> = {
      orderStatus: 'Cancelled',
      paymentStatus: 'Refunded',
      cancellationReason: reason,
      cancelledAt: `${timeStr}, ${dateStr}`
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patchFields } : o))
    );

    fetch(`${BACKEND_API_BASE}/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchFields)
    }).catch((e) => console.warn('Backend sync failed:', e));
  };

  const updateOrderStatus = (orderId: string, status: OrderRecord['orderStatus'], trackingNumber?: string) => {
    const patchFields: Partial<OrderRecord> = {
      orderStatus: status,
      ...(trackingNumber !== undefined ? { trackingNumber } : {})
    };
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patchFields } : o))
    );
    fetch(`${BACKEND_API_BASE}/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchFields)
    }).catch((e) => console.warn('Backend sync failed:', e));
  };

  const updatePaymentStatus = (orderId: string, status: OrderRecord['paymentStatus']) => {
    const patchFields: Partial<OrderRecord> = { paymentStatus: status };
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patchFields } : o))
    );
    fetch(`${BACKEND_API_BASE}/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchFields)
    }).catch((e) => console.warn('Backend sync failed:', e));
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
    fetch(`${BACKEND_API_BASE}/${orderId}`, {
      method: 'DELETE'
    }).catch((e) => console.warn('Backend sync failed:', e));
  };

  const updateOrder = (orderId: string, updatedFields: Partial<OrderRecord>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o))
    );
    fetch(`${BACKEND_API_BASE}/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    }).catch((e) => console.warn('Backend sync failed:', e));
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
