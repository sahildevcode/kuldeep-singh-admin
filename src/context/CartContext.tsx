import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, OrderRecord } from '../types';

const confetti = (_options?: unknown) => {};

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const SAMPLE_INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ORD-2026-SEP-01',
    customerName: 'Aarav Singhania',
    customerEmail: 'aarav.singhania@heritageart.in',
    customerPhone: '+91 98210 44521',
    date: 'Sep 7, 2026',
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
    paymentMethod: 'HDFC NetBanking / RTGS Wire',
    paymentStatus: 'Paid',
    orderStatus: 'In Transit',
    deliveryAddress: 'Villa 14, Palm Avenue, Juhu, Mumbai, Maharashtra 400049',
    trackingNumber: 'BLUEDART-EXP-90812'
  },
  {
    id: 'ORD-2026-SEP-02',
    customerName: 'Meera Kapoor',
    customerEmail: 'meera.k@kapoordesigns.com',
    customerPhone: '+91 99100 88234',
    date: 'Sep 5, 2026',
    orderMonth: '2026-09',
    items: [
      {
        id: 'art-02',
        type: 'artwork',
        title: 'Whispers of the Eternal Forest',
        subtitle: 'Handmade Pigment & Gold Leaf on Canvas (36 x 48 in)',
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
    deliveryAddress: 'B-42, Amrita Shergill Marg, New Delhi 110003',
    trackingNumber: 'DELHIVERY-PRM-44120'
  },
  {
    id: 'ORD-2026-SEP-03',
    customerName: 'Devansh Malhotra',
    customerEmail: 'devansh@malhotragroup.co',
    customerPhone: '+91 98450 12903',
    date: 'Sep 4, 2026',
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
    paymentMethod: 'ICICI Bank Transfer (Pending Verification)',
    paymentStatus: 'Pending Payment',
    orderStatus: 'Order Placed',
    deliveryAddress: 'Penthouse 7B, Sky Tower, Koramangala, Bengaluru 560034',
  },
  {
    id: 'ORD-2026-AUG-01',
    customerName: 'Countess Vivienne St. Claire',
    customerEmail: 'vivienne@stclairecollections.ch',
    customerPhone: '+41 79 412 8890',
    date: 'Aug 26, 2026',
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
    deliveryAddress: 'Bahnhofstrasse 45, 8001 Zurich, Switzerland',
    trackingNumber: 'DHL-EXPRESS-992301'
  },
  {
    id: 'ORD-2026-AUG-02',
    customerName: 'Rajesh & Sunita Oberoi',
    customerEmail: 'oberoi.art@gmail.com',
    customerPhone: '+91 98110 55102',
    date: 'Aug 18, 2026',
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
    deliveryAddress: 'House 12, Golf Links, New Delhi 110003',
    trackingNumber: 'BLUEDART-EXP-77192'
  },
  {
    id: 'ORD-2026-AUG-03',
    customerName: 'Kabir Varma',
    customerEmail: 'kabir.v@varmaholdings.in',
    customerPhone: '+91 97690 33419',
    date: 'Aug 10, 2026',
    orderMonth: '2026-08',
    items: [
      {
        id: 'art-06',
        type: 'artwork',
        title: 'Study in Umber Shadows',
        subtitle: 'Experimental Mixed Media (30 x 40 in)',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Acrylic & Mixed Media',
      }
    ],
    subtotal: 120000,
    discount: 0,
    shipping: 0,
    totalAmount: 120000,
    paymentMethod: 'NetBanking',
    paymentStatus: 'Refunded',
    orderStatus: 'Cancelled',
    deliveryAddress: 'Banjara Hills, Hyderabad 500034',
    cancellationReason: 'Customer requested size customization prior to shipment',
    cancelledAt: '03:15 PM, Aug 11, 2026'
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
      const saved = localStorage.getItem('kuldeep_art_orders_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      localStorage.setItem('kuldeep_art_orders_v2', JSON.stringify(orders));
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
      setDiscountPercent(0.15); // 15% discount
      setDiscountError(null);
      return true;
    } else if (clean === 'VIPCOLLECTOR') {
      setDiscountCode(clean);
      setDiscountPercent(0.2); // 20% discount
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
  const shipping = subtotal > 0 ? 0 : 0;
  const finalTotal = Math.max(0, subtotal - discount + shipping);

  const addOrder = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
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

    const generatedId = 'ORD-' + Date.now().toString().slice(-6);
    setLastOrderId(generatedId);
    setIsCheckingOut(false);
    setCheckoutSuccess(true);

    const now = new Date();
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newOrder: OrderRecord = {
      id: generatedId,
      customerName: customerInfo?.name || 'Collector Guest',
      customerEmail: customerInfo?.email || 'collector@kuldeepsingh.art',
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      orderMonth: nowMonth,
      items: [...cart],
      subtotal,
      discount,
      shipping,
      totalAmount: finalTotal,
      paymentMethod: 'Instant Razorpay / Bank Wire',
      paymentStatus: 'Paid',
      orderStatus: 'Fine Art Packing',
      deliveryAddress: 'Standard Fine Art Insured Crating',
    };

    addOrder(newOrder);
    clearCart();

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E63946', '#D97706', '#2563EB', '#059669', '#C5A059']
      });
    } catch {
      // ignore
    }
  };

  const resetCheckout = () => {
    setCheckoutSuccess(false);
    setIsCartOpen(false);
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
        updatePaymentStatus
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
