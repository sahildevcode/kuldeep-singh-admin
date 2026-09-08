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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SAMPLE_INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'KS-2026-89421',
    customerName: 'Countess Vivienne',
    customerEmail: 'collector@kuldeepsingh.art',
    date: 'Sep 2, 2026',
    items: [
      {
        id: 'art-01',
        type: 'artwork',
        title: 'Symphony of the Solitary Tide',
        subtitle: 'Original Oil on Belgian Linen (40 x 54 in)',
        price: 4850,
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Oil on Canvas',
      }
    ],
    subtotal: 4850,
    discount: 727,
    shipping: 0,
    totalAmount: 4123,
    paymentMethod: 'Verified Bank Wire / UPI',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    deliveryAddress: 'Upper East Side, Manhattan, New York',
  },
  {
    id: 'KS-2026-67310',
    customerName: 'Leo Montoya',
    customerEmail: 'student@kuldeepsingh.art',
    date: 'Aug 28, 2026',
    items: [
      {
        id: 'course-oil-mastery',
        type: 'course',
        title: 'The Master Oil Painting Diploma',
        subtitle: '3 Months Intensive Masterclass by Kuldeep Singh',
        price: 349,
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Oil Painting',
      }
    ],
    subtotal: 349,
    discount: 52,
    shipping: 0,
    totalAmount: 297,
    paymentMethod: 'Instant UPI / Card',
    paymentStatus: 'Paid',
    orderStatus: 'Course Active & Unlocked',
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
      const saved = localStorage.getItem('kuldeep_art_orders');
      return saved ? JSON.parse(saved) : SAMPLE_INITIAL_ORDERS;
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
      localStorage.setItem('kuldeep_art_orders', JSON.stringify(orders));
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
            const newQ = i.quantity + delta;
            return newQ > 0 ? { ...i, quantity: newQ } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyDiscountCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ARTISAN15' || clean === 'KULDEEP15') {
      setDiscountCode(clean);
      setDiscountPercent(0.15);
      setDiscountError(null);
      return true;
    }
    if (clean === 'COLLECTOR20') {
      setDiscountCode(clean);
      setDiscountPercent(0.20);
      setDiscountError(null);
      return true;
    }
    setDiscountError('Invalid promotional code. Try KULDEEP15');
    return false;
  };

  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountPercent(0);
    setDiscountError(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.round(subtotal * discountPercent);

  const hasPhysicalArt = cart.some((i) => i.type === 'artwork');
  const shipping = hasPhysicalArt ? (subtotal > 3000 ? 0 : 180) : 0;
  const finalTotal = Math.max(0, subtotal - discount + shipping);

  const addOrder = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
  };

  const performCheckout = async (customerInfo?: { name: string; email: string }) => {
    setIsCheckingOut(true);
    await new Promise((res) => setTimeout(res, 1200));
    setIsCheckingOut(false);
    setCheckoutSuccess(true);

    const orderNum = 'KS-2026-' + Math.floor(10000 + Math.random() * 90000);
    setLastOrderId(orderNum);

    // Create persistent OrderRecord
    const newOrder: OrderRecord = {
      id: orderNum,
      customerName: customerInfo?.name || 'Verified Art Patron',
      customerEmail: customerInfo?.email || 'collector@kuldeepsingh.art',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: [...cart],
      subtotal,
      discount,
      shipping,
      totalAmount: finalTotal,
      paymentMethod: 'Demo Razorpay / UPI Express',
      paymentStatus: 'Paid',
      orderStatus: hasPhysicalArt ? 'In Transit' : 'Course Active & Unlocked',
      deliveryAddress: hasPhysicalArt ? 'Standard Fine Art Insured Crating' : undefined,
    };

    addOrder(newOrder);
    clearCart();

    // Trigger celebration confetti
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
